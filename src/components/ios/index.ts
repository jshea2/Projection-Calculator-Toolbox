/**
 * iOS 18 Design System Components
 * 
 * A collection of iOS-native styled components for React + Tailwind
 * that follow Apple's Human Interface Guidelines.
 * 
 * Features:
 * - SF Pro font stack with system fallbacks
 * - Safe area inset support
 * - iOS system colors (light/dark mode)
 * - Blur effects with backdrop-filter
 * - Spring animations
 * - Haptic feedback data attributes
 * 
 * Usage:
 * ```tsx
 * import { 
 *   IOSCard, 
 *   IOSButton, 
 *   IOSTabBar, 
 *   IOSSheet, 
 *   IOSListItem,
 *   IOSSegmentedControl,
 *   IOSInput,
 *   IOSSelect
 * } from '@/components/ios';
 * ```
 */

// Layout Components
export { IOSCard } from './IOSCard';
export { IOSSheet } from './IOSSheet';
export { IOSListItem, IOSListSection } from './IOSListItem';

// Navigation Components
export { IOSTabBar } from './IOSTabBar';

// Form Components
export { IOSButton } from './IOSButton';
export { IOSSegmentedControl } from './IOSSegmentedControl';
export { IOSInput } from './IOSInput';
export { IOSSelect } from './IOSSelect';
