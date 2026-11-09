/**
 * PalStore — 本地助手（Pal）的唯一数据源。
 *
 * 口袋AI 只保留本地助手：创建、编辑、删除与内置助手种子。上游的 PalsHub
 * 市场、购买与同步已移除。
 */
import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {palRepository} from '../repositories/PalRepository';

import {registerDefaultTalents} from '../services/talents';
import {LOOKIE_DEFAULT_MODEL} from './builtinPalModels';
import {chinesePals} from './chinesePals';

import type {Pal, PalUpdate} from '../types/pal';

import {deletePalThumbnail} from '../utils/imageUtils';

// Track each built-in separately so future defaults can still be introduced.
const LOOKIE_SEEDED_KEY = 'PalStore.builtin.Lookie.seeded';
const PIP_SEEDED_KEY = 'PalStore.builtin.Pip.seeded';

class PalStore {
  // Core pals storage
  pals: Pal[] = [];

  // Migration state
  isMigrating: boolean = false;
  migrationComplete: boolean = false;
  migrationVersion: string = '1.0';

  readonly ready: Promise<void>;

  constructor() {
    makeAutoObservable(this, {
      ready: false,
    });
    this.ready = this.initialize();
    console.log('Pal store initialized');
    console.log('Pals number: ', this.pals.length);
  }

  async initialize() {
    try {
      runInAction(() => {
        this.isMigrating = true;
      });

      // Migrate from JSON/AsyncStorage to database
      await palRepository.checkAndMigrateFromJSON();

      // Load pals from database
      await this.loadPalsFromDatabase();

      // Initialize Lookie pal after database is loaded
      await this.initializeLookiePal();

      // Initialize Pip pal (idempotent — see initializePipPal).
      await this.initializePipPal();

      // Register talent engines (idempotent)
      registerDefaultTalents();

      console.log('Pal store initialization completed');

      runInAction(() => {
        this.isMigrating = false;
        this.migrationComplete = true;
      });
    } catch (error) {
      console.error('Failed to initialize pal store:', error);
      runInAction(() => {
        this.isMigrating = false;
        this.migrationComplete = false;
      });
    }
  }

  /**
   * Load pals from database into MobX store
   */
  private async loadPalsFromDatabase() {
    try {
      const pals = await palRepository.getAllPals();
      runInAction(() => {
        this.pals = pals;
      });
    } catch (error) {
      console.error('Error loading pals from database:', error);
    }
  }

  // Core unified pal management methods

  /**
   * Adds a pal to both repository and store (handles persistence + state)
   * This is the ONLY method that should handle repository + store updates
   */
  private addPal = async (
    palData: Omit<Pal, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Pal> => {
    const savedPal = await palRepository.createPal(palData);

    runInAction(() => {
      this.pals.push(savedPal);
    });

    return savedPal;
  };

  /**
   * Creates a new pal
   */
  createPal = async (
    palData: Omit<Pal, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Pal> => {
    return this.addPal(palData);
  };

  /**
   * Updates an existing pal
   */
  updatePal = async (id: string, updates: PalUpdate): Promise<void> => {
    try {
      const updatedPal = await palRepository.updatePal(id, updates);
      if (updatedPal) {
        runInAction(() => {
          const palIndex = this.pals.findIndex(p => p.id === id);
          if (palIndex !== -1) {
            this.pals[palIndex] = updatedPal;
          }
        });
      } else {
        throw new Error('Failed to update pal - no updated pal returned');
      }
    } catch (error) {
      console.error('Error updating pal:', error);
      throw error; // Re-throw so calling code can handle it
    }
  };

  /**
   * Deletes a pal
   */
  deletePal = async (id: string): Promise<void> => {
    try {
      // Find the pal to get its thumbnail path before deletion
      const palIndex = this.pals.findIndex(p => p.id === id);
      const pal = palIndex !== -1 ? this.pals[palIndex] : null;

      const success = await palRepository.deletePal(id);
      if (success) {
        // Clean up local thumbnail image if it exists
        if (pal?.thumbnail_url) {
          try {
            await deletePalThumbnail(pal.thumbnail_url);
          } catch (imageError) {
            console.warn('Failed to delete thumbnail image:', imageError);
            // Don't fail the entire deletion if image cleanup fails
          }
        }

        runInAction(() => {
          if (palIndex !== -1) {
            this.pals.splice(palIndex, 1);
          }
        });
      }
    } catch (error) {
      console.error('Error deleting pal:', error);
    }
  };

  /**
   * Gets all pals
   */
  getPals = (): Pal[] => {
    return this.pals;
  };

  /**
   * Gets a pal by ID
   */
  getPalById = (id: string): Pal | undefined => {
    return this.pals.find(p => p.id === id);
  };

  getLocalPals = () => {
    return this.pals;
  };

  // Capability-based filtering methods
  getVideoPals = () => {
    return this.pals.filter(pal => pal.capabilities?.video === true);
  };

  getAllPals = () => {
    return this.pals;
  };

  /**
   * Seed the default "Lookie" VideoPal once. After the first launch that
   * records the seed, deletions and renames are preserved; on that launch a
   * missing Lookie is created (installs that predate the key included).
   */
  private async initializeLookiePal(): Promise<void> {
    try {
      if ((await AsyncStorage.getItem(LOOKIE_SEEDED_KEY)) === 'true') {
        return;
      }

      // Check if Lookie already exists
      const lookiePal = this.pals.find(
        p =>
          p.capabilities?.video === true && p.name === chinesePals.lookie.name,
      );

      if (!lookiePal) {
        console.log('Creating default video pal...');

        // Offline constant — no network resolve at pal init.
        const defaultModel = LOOKIE_DEFAULT_MODEL;

        // Create the Lookie pal with all the original properties
        const palData: Omit<Pal, 'id' | 'created_at' | 'updated_at'> = {
          type: 'local',
          name: chinesePals.lookie.name,
          description: chinesePals.lookie.description,
          systemPrompt: chinesePals.lookie.systemPrompt,
          isSystemPromptChanged: false,
          useAIPrompt: false,
          defaultModel: defaultModel, // Set the default model so users know what to download
          parameters: {
            captureInterval: '3000', // 3 seconds (original value) - stored as string for text input
          },
          parameterSchema: [
            {
              key: 'captureInterval',
              type: 'text',
              label: '截图间隔（毫秒）',
              required: false,
            },
          ],
          capabilities: {video: true},
          color: ['#9E204F', '#F6E1EA'], // Original Lookie colors
          source: 'local',
        };

        await this.addPal(palData);
      } else {
        console.log('Lookie pal already exists, skipping creation');
      }
      await AsyncStorage.setItem(LOOKIE_SEEDED_KEY, 'true');
    } catch (error) {
      console.error('Error initializing Lookie pal:', error);
    }
  }

  /**
   * Seed the default "Pip" recommended pal once. After the first launch that
   * records the seed, deletions and renames are preserved; on that launch a
   * missing Pip is created (installs that predate the key included).
   *
   * Idempotent: a re-entry never overwrites an existing Pip record, so a
   * `defaultModel` bound from a prior session (e.g. by the onboarding
   * recommended-pal picker) survives subsequent app starts.
   */
  private async initializePipPal(): Promise<void> {
    try {
      if ((await AsyncStorage.getItem(PIP_SEEDED_KEY)) === 'true') {
        return;
      }

      const existing = this.pals.find(
        p => p.name === chinesePals.pip.name && p.source === 'local',
      );
      if (existing) {
        await AsyncStorage.setItem(PIP_SEEDED_KEY, 'true');
        return;
      }

      const palData: Omit<Pal, 'id' | 'created_at' | 'updated_at'> = {
        type: 'local',
        name: chinesePals.pip.name,
        description: chinesePals.pip.description,
        systemPrompt: chinesePals.pip.systemPrompt,
        isSystemPromptChanged: false,
        useAIPrompt: false,
        defaultModel: undefined,
        parameters: {},
        parameterSchema: [],
        capabilities: {},
        color: ['#0E0D0C', '#FAFAFA'],
        source: 'local',
      };

      await this.addPal(palData);
      await AsyncStorage.setItem(PIP_SEEDED_KEY, 'true');
    } catch (error) {
      console.error('Error initializing Pip pal:', error);
    }
  }
}

export const palStore = new PalStore();

// Export types for external use
export type {Pal} from '../types/pal';
export type {LegacyPalData} from '../utils/pal-migration';
