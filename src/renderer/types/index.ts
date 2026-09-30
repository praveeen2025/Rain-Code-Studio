/**
 * Renderer UI Types
 */

export * from '../../shared/types';
export * from '../../shared/api-types';

export interface UIState {
  activePage: string;
  isRightPanelOpen: boolean;
  selectedFilePath: string | null;
}
