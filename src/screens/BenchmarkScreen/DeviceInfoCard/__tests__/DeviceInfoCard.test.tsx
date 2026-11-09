import React from 'react';
import {Platform} from 'react-native';
import {fireEvent, render, waitFor} from '../../../../../jest/test-utils';
import {DeviceInfoCard} from '../DeviceInfoCard';

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn().mockReturnValue('iPhone 13'),
  getBrand: jest.fn().mockReturnValue('Apple'),
  getSystemVersion: jest.fn().mockReturnValue('17.0'),
  getVersion: jest.fn().mockReturnValue('1.0.0'),
  getBuildNumber: jest.fn().mockReturnValue('100'),
  supportedAbis: jest.fn().mockResolvedValue(['arm64']),
  isEmulator: jest.fn().mockResolvedValue(false),
  getDevice: jest.fn().mockResolvedValue('iPhone14,2'),
  getDeviceId: jest.fn().mockResolvedValue('device-id-123'),
  getTotalMemory: jest.fn().mockResolvedValue(6 * 1024 * 1024 * 1024), // 6GB
}));

describe('DeviceInfoCard', () => {
  const mockOnDeviceInfo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('renders basic device information correctly', async () => {
    const {getByText, getByTestId, debug} = render(
      <DeviceInfoCard onDeviceInfo={mockOnDeviceInfo} />,
    );

    debug();

    // Wait for the device info to load
    await waitFor(() => {
      expect(getByText('Device Information')).toBeTruthy();
      expect(getByText(/iPhone 13/)).toBeTruthy();
    });

    // Check that card exists
    expect(getByTestId('device-info-card')).toBeTruthy();
  });

  it('can be expanded and collapsed', async () => {
    const {getByText, queryByText} = render(
      <DeviceInfoCard onDeviceInfo={mockOnDeviceInfo} />,
    );

    // Wait for the device info to load
    await waitFor(() => {
      expect(getByText('Device Information')).toBeTruthy();
    });

    // Initially, detailed info should not be visible
    expect(queryByText('Basic Info')).toBeNull();

    // Expand the card
    fireEvent.press(getByText('Device Information'));

    // Now detailed info should be visible
    expect(getByText('Basic Info')).toBeTruthy();
    expect(getByText('Architecture')).toBeTruthy();
    expect(getByText('Total Memory')).toBeTruthy();
    expect(getByText('Device ID')).toBeTruthy();
    expect(getByText('CPU Details')).toBeTruthy();

    // Collapse the card
    fireEvent.press(getByText('Device Information'));

    // Detailed info should be hidden again
    expect(queryByText('Basic Info')).toBeNull();
  });

  it('calls onDeviceInfo with device information when loaded', async () => {
    render(<DeviceInfoCard onDeviceInfo={mockOnDeviceInfo} />);

    // Wait for device info to be loaded and callback to be called
    await waitFor(() => {
      expect(mockOnDeviceInfo).toHaveBeenCalled();
      const deviceInfo = mockOnDeviceInfo.mock.calls[0][0];

      // Check the passed deviceInfo object
      expect(deviceInfo.model).toBe('iPhone 13');
      expect(deviceInfo.brand).toBe('Apple');
      expect(deviceInfo.systemName).toBe('iOS');
      expect(deviceInfo.cpuArch).toEqual(['arm64']);
      expect(deviceInfo.totalMemory).toBe(6 * 1024 * 1024 * 1024);
    });
  });

  it('allows specifying a custom testId', async () => {
    const {getByTestId} = render(
      <DeviceInfoCard
        onDeviceInfo={mockOnDeviceInfo}
        testId="custom-device-info"
      />,
    );

    await waitFor(() => {
      expect(getByTestId('custom-device-info')).toBeTruthy();
    });
  });
});
