import {runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {palStore} from '../PalStore';
import {palRepository} from '../../repositories/PalRepository';
import type {Pal} from '../../types/pal';
import * as imageUtils from '../../utils/imageUtils';
import {resolveHFModelForDownload} from '../../utils/hfResolve';
import {LOOKIE_DEFAULT_MODEL} from '../builtinPalModels';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    clear: jest.fn(async () => values.clear()),
  };
});

// Mock dependencies
jest.mock('../../utils/hfResolve', () => ({
  resolveHFModelForDownload: jest.fn(),
}));
jest.mock('../../repositories/PalRepository', () => ({
  palRepository: {
    getAllPals: jest.fn(),
    createPal: jest.fn(),
    updatePal: jest.fn(),
    deletePal: jest.fn(),
    getPalById: jest.fn(),
    getPalByPalshubId: jest.fn().mockResolvedValue(null),
    checkAndMigrateFromJSON: jest.fn(),
    getLocalPals: jest.fn(),
    getPalsHubPals: jest.fn(),
  },
}));

jest.mock('../../utils/imageUtils', () => ({
  downloadPalThumbnail: jest.fn(),
  deletePalThumbnail: jest.fn(),
}));

// Mock MobX persist
jest.mock('mobx-persist-store', () => ({
  makePersistable: jest.fn(),
}));

describe('PalStore', () => {
  const mockPal: Pal = {
    type: 'local',
    id: 'test-pal-1',
    name: 'Test Pal',
    description: 'A test pal',
    systemPrompt: 'You are a helpful assistant.',
    originalSystemPrompt: 'You are a helpful assistant.',
    isSystemPromptChanged: false,
    useAIPrompt: false,
    parameters: {},
    parameterSchema: [],
    source: 'local',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();

    // Reset store state
    runInAction(() => {
      palStore.pals = [];
      palStore.isMigrating = false;
      palStore.migrationComplete = false;
    });

    // Setup default mocks
    (palRepository.getAllPals as jest.Mock).mockResolvedValue([]);
    (palRepository.checkAndMigrateFromJSON as jest.Mock).mockResolvedValue(
      undefined,
    );
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const mockPals = [mockPal];
      (palRepository.getAllPals as jest.Mock).mockResolvedValue(mockPals);

      // Create a new store instance to test initialization
      // eslint-disable-next-line no-new
      new (palStore.constructor as any)();

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(palRepository.checkAndMigrateFromJSON).toHaveBeenCalled();
      expect(palRepository.getAllPals).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Database error');
      (palRepository.getAllPals as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a new store instance to test initialization
      // eslint-disable-next-line no-new
      new (palStore.constructor as any)();

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading pals from database:',
        error,
      );

      consoleSpy.mockRestore();
    });

    it('creates the Lookie pal from the offline constant without a network resolve', async () => {
      (palRepository.getAllPals as jest.Mock).mockResolvedValue([]);
      (palRepository.createPal as jest.Mock).mockImplementation(
        async (palData: any) => ({
          ...palData,
          id: 'lookie-id',
          created_at: 'now',
          updated_at: 'now',
        }),
      );

      // eslint-disable-next-line no-new
      new (palStore.constructor as any)();
      await new Promise(resolve => setTimeout(resolve, 100));

      const lookieCall = (palRepository.createPal as jest.Mock).mock.calls.find(
        call => call[0]?.name === '看图助手',
      );

      expect(lookieCall).toBeDefined();
      expect(lookieCall![0].defaultModel).toBe(LOOKIE_DEFAULT_MODEL);
      // No HF resolve / network call at pal init.
      expect(resolveHFModelForDownload).not.toHaveBeenCalled();
    });

    it('does not recreate the Lookie pal if one already exists', async () => {
      const existingLookie: Pal = {
        ...mockPal,
        id: 'existing-lookie',
        name: '看图助手',
        capabilities: {video: true},
      } as Pal;
      (palRepository.getAllPals as jest.Mock).mockResolvedValue([
        existingLookie,
      ]);

      // eslint-disable-next-line no-new
      new (palStore.constructor as any)();
      await new Promise(resolve => setTimeout(resolve, 100));

      const lookieCreate = (
        palRepository.createPal as jest.Mock
      ).mock.calls.find(call => call[0]?.name === '看图助手');
      expect(lookieCreate).toBeUndefined();
      expect(resolveHFModelForDownload).not.toHaveBeenCalled();
    });
  });

  describe('Pip seeding', () => {
    const callInitializePipPal = async () =>
      (palStore as any).initializePipPal();

    beforeEach(() => {
      runInAction(() => {
        palStore.pals = [];
      });
      (palRepository.createPal as jest.Mock).mockImplementation(
        async (palData: any) => ({
          ...palData,
          id: `pip-${Math.random().toString(36).slice(2, 8)}`,
          created_at: '2026-05-26T00:00:00Z',
          updated_at: '2026-05-26T00:00:00Z',
        }),
      );
    });

    it('seeds Pip when absent', async () => {
      await callInitializePipPal();
      const pip = palStore.pals.find(
        p => p.name === '聊天助手' && p.source === 'local',
      );
      expect(pip).toBeDefined();
      expect(pip?.type).toBe('local');
      expect(pip?.defaultModel).toBeUndefined();
      expect(palRepository.createPal).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when Pip is already present', async () => {
      await callInitializePipPal();
      (palRepository.createPal as jest.Mock).mockClear();
      await callInitializePipPal();
      const pipCount = palStore.pals.filter(
        p => p.name === '聊天助手' && p.source === 'local',
      ).length;
      expect(pipCount).toBe(1);
      expect(palRepository.createPal).not.toHaveBeenCalled();
    });

    it('preserves an existing Pip record (including defaultModel) on re-init', async () => {
      const boundModel = {
        id: 'some-bound-model',
        name: 'Some Bound Model',
      } as any;
      const existingPip: Pal = {
        ...mockPal,
        id: 'pip-existing',
        name: '聊天助手',
        source: 'local',
        type: 'local',
        defaultModel: boundModel,
      } as any;
      runInAction(() => {
        palStore.pals = [existingPip];
      });

      await callInitializePipPal();

      const pip = palStore.pals.find(
        p => p.name === '聊天助手' && p.source === 'local',
      );
      expect(pip).toBeDefined();
      expect(pip?.id).toBe('pip-existing');
      // defaultModel content is preserved across re-init (MobX wraps
      // observed objects in Proxies, so Object.is equality is brittle;
      // value equality verifies the field wasn't cleared or rewritten).
      expect(pip?.defaultModel).toEqual(boundModel);
      expect(palRepository.createPal).not.toHaveBeenCalled();
    });

    it('coexists with Lookie regardless of order (idempotent)', async () => {
      const lookie: Pal = {
        ...mockPal,
        id: 'lookie-1',
        name: '看图助手',
        source: 'local',
        type: 'local',
        capabilities: {video: true},
      } as any;
      runInAction(() => {
        palStore.pals = [lookie];
      });

      await callInitializePipPal();
      await callInitializePipPal();

      const names = palStore.pals.map(p => p.name).sort();
      expect(names).toEqual(['看图助手', '聊天助手']);
    });
  });

  describe.each([
    ['看图助手', 'initializeLookiePal'],
    ['聊天助手', 'initializePipPal'],
  ])('%s seed persistence', (name, initializer) => {
    const seed = () => (palStore as any)[initializer]();

    beforeEach(() => {
      (palRepository.createPal as jest.Mock).mockImplementation(
        async (data: Partial<Pal>) => ({...mockPal, ...data}),
      );
      (palRepository.deletePal as jest.Mock).mockResolvedValue(true);
    });

    it('does not recreate a deleted default pal on the next initialization', async () => {
      await seed();
      await palStore.deletePal(palStore.pals[0].id);
      expect(palStore.pals).toHaveLength(0);
      (palRepository.createPal as jest.Mock).mockClear();

      await seed();

      expect(palRepository.createPal).not.toHaveBeenCalled();
      expect(palStore.pals).toHaveLength(0);
    });

    it('does not recreate a default pal after it is renamed', async () => {
      await seed();
      runInAction(() => {
        palStore.pals[0].name = 'My renamed pal';
      });
      (palRepository.createPal as jest.Mock).mockClear();

      await seed();

      expect(palRepository.createPal).not.toHaveBeenCalled();
      expect(palStore.pals).toHaveLength(1);
      expect(palStore.pals[0].name).toBe('My renamed pal');
    });

    it('records existing default pals before they are deleted', async () => {
      runInAction(() => {
        palStore.pals = [{...mockPal, name, capabilities: {video: true}}];
      });
      await seed();
      expect(palRepository.createPal).not.toHaveBeenCalled();
      await palStore.deletePal(mockPal.id);

      await seed();

      expect(palRepository.createPal).not.toHaveBeenCalled();
      expect(palStore.pals).toHaveLength(0);
    });

    it('retries seeding after creation fails', async () => {
      (palRepository.createPal as jest.Mock).mockRejectedValueOnce(
        new Error('Database unavailable'),
      );
      await seed();
      expect(palStore.pals).toHaveLength(0);

      await seed();

      expect(palRepository.createPal).toHaveBeenCalledTimes(2);
      expect(palStore.pals[0].name).toBe(name);
    });
  });

  describe('Core CRUD Operations', () => {
    describe('createPal', () => {
      it('should create a new pal successfully', async () => {
        const newPalData = {
          name: 'New Test Pal',
          description: 'A new test pal',
          systemPrompt: 'You are a helpful assistant.',
          originalSystemPrompt: 'You are a helpful assistant.',
          isSystemPromptChanged: false,
          useAIPrompt: false,
          parameters: {},
          parameterSchema: [],
          source: 'local' as const,
          type: 'local' as const,
        };

        const createdPal = {...newPalData, ...mockPal};
        (palRepository.createPal as jest.Mock).mockResolvedValue(createdPal);

        const result = await palStore.createPal(newPalData);

        expect(palRepository.createPal).toHaveBeenCalledWith(newPalData);
        expect(result).toEqual(createdPal);
        expect(palStore.pals).toContainEqual(createdPal);
      });

      it('should handle creation errors', async () => {
        const error = new Error('Creation failed');
        (palRepository.createPal as jest.Mock).mockRejectedValue(error);

        const newPalData = {
          name: 'New Test Pal',
          systemPrompt: 'You are a helpful assistant.',
          originalSystemPrompt: 'You are a helpful assistant.',
          isSystemPromptChanged: false,
          useAIPrompt: false,
          parameters: {},
          parameterSchema: [],
          source: 'local' as const,
          type: 'local' as const,
        };

        await expect(palStore.createPal(newPalData)).rejects.toThrow(
          'Creation failed',
        );
        expect(palStore.pals).not.toContain(
          expect.objectContaining({name: 'New Test Pal'}),
        );
      });
    });

    describe('updatePal', () => {
      beforeEach(() => {
        runInAction(() => {
          palStore.pals = [mockPal];
        });
      });

      it('should update an existing pal successfully', async () => {
        const updates = {
          name: 'Updated Pal Name',
          description: 'Updated description',
        };
        const updatedPal = {
          ...mockPal,
          ...updates,
          updated_at: '2023-01-02T00:00:00Z',
        };

        (palRepository.updatePal as jest.Mock).mockResolvedValue(updatedPal);

        await palStore.updatePal(mockPal.id, updates);

        expect(palRepository.updatePal).toHaveBeenCalledWith(
          mockPal.id,
          updates,
        );
        expect(palStore.pals[0]).toEqual(updatedPal);
      });

      it('should handle update errors', async () => {
        const error = new Error('Update failed');
        (palRepository.updatePal as jest.Mock).mockRejectedValue(error);

        await expect(
          palStore.updatePal(mockPal.id, {name: 'Updated'}),
        ).rejects.toThrow('Update failed');
      });

      it('should handle case when updated pal is not returned', async () => {
        (palRepository.updatePal as jest.Mock).mockResolvedValue(null);

        await expect(
          palStore.updatePal(mockPal.id, {name: 'Updated'}),
        ).rejects.toThrow('Failed to update pal - no updated pal returned');
      });
    });

    describe('deletePal', () => {
      beforeEach(() => {
        runInAction(() => {
          palStore.pals = [mockPal];
        });
      });

      it('should delete a pal successfully', async () => {
        (palRepository.deletePal as jest.Mock).mockResolvedValue(true);
        (imageUtils.deletePalThumbnail as jest.Mock).mockResolvedValue(
          undefined,
        );

        await palStore.deletePal(mockPal.id);

        expect(palRepository.deletePal).toHaveBeenCalledWith(mockPal.id);
        expect(palStore.pals).not.toContain(mockPal);
      });

      it('should handle deletion errors gracefully', async () => {
        const error = new Error('Deletion failed');
        (palRepository.deletePal as jest.Mock).mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Should not throw, but should log error
        await palStore.deletePal(mockPal.id);

        expect(consoleSpy).toHaveBeenCalledWith('Error deleting pal:', error);
        expect(palStore.pals).toContainEqual(mockPal); // Should still be there

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      runInAction(() => {
        palStore.pals = [
          mockPal,
          {
            ...mockPal,
            id: 'video-pal',
            name: 'Video Pal',
            capabilities: {video: true},
          },
          {
            ...mockPal,
            id: 'palshub-pal',
            name: 'PalsHub Pal',
            source: 'palshub',
            palshub_id: 'ph-123',
          },
        ];
      });
    });

    it('should get video pals', () => {
      const videoPals = palStore.getVideoPals();
      expect(videoPals).toHaveLength(1);
      expect(videoPals[0].id).toBe('video-pal');
    });

    it('should get all pals', () => {
      const allPals = palStore.getAllPals();
      expect(allPals).toHaveLength(3);
    });
  });
});
