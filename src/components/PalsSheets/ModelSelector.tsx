import React from 'react';
import {observer} from 'mobx-react-lite';
import {Selector, SelectorOption} from '../Selector';
import {modelStore} from '../../store';
import {Model, ModelType} from '../../utils/types';

interface ModelSelectorProps {
  value?: Model;
  onChange: (value: Model) => void;
  label: string;
  sublabel?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  filter?: (model: Model) => boolean;
  /** 也列出还没下载的模型（名字后加 undownloadedSuffix），选中后由下方的下载提示负责下载 */
  includeUndownloaded?: boolean;
  undownloadedSuffix?: string;
  testID?: string;
}

export const ModelSelector = observer(
  ({
    value,
    onChange,
    label,
    sublabel,
    placeholder = 'Select model',
    error,
    helperText,
    required,
    disabled,
    filter,
    includeUndownloaded = false,
    undownloadedSuffix = '',
    testID,
  }: ModelSelectorProps) => {
    // 可选的模型：已下载的在前；includeUndownloaded 时再加上列表里还没下载的
    const downloaded = modelStore.availableModels;
    const candidates: Model[] = includeUndownloaded
      ? [
          ...downloaded,
          ...modelStore.models.filter(
            m =>
              !downloaded.some(d => d.id === m.id) &&
              m.modelType !== ModelType.PROJECTION,
          ),
        ]
      : downloaded;
    const visible = candidates.filter(model => (filter ? filter(model) : true));

    const options: SelectorOption<string>[] = visible.map(model => ({
      label: downloaded.some(d => d.id === model.id)
        ? model.name
        : `${model.name}${undownloadedSuffix}`,
      value: model.id,
    }));

    const handleModelChange = (modelId: string) => {
      const selectedModel = visible.find(model => model.id === modelId);
      if (selectedModel) {
        onChange(selectedModel);
      }
    };

    return (
      <Selector
        options={options}
        value={value?.id || ''}
        onChange={handleModelChange}
        label={label}
        sublabel={sublabel}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        error={error}
        helperText={helperText}
        testID={testID}
      />
    );
  },
);
