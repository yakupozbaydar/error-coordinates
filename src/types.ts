import * as vscode from "vscode";

export interface ErrorEntry {
  line: number;
  message: string;
  range: vscode.Range;
  source: string;
  code: string | number | undefined;
}

export type ErrorMap = Map<string, ErrorEntry[]>;

export interface ExtensionConfig {
  enabled: boolean;
  gutterIconEnabled: boolean;
  overviewRulerEnabled: boolean;
  markerColor: string;
  showToastOnJump: boolean;
}

export function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration("errorCoordinates");
  return {
    enabled: cfg.get<boolean>("enabled", true),
    gutterIconEnabled: cfg.get<boolean>("gutterIconEnabled", true),
    overviewRulerEnabled: cfg.get<boolean>("overviewRulerEnabled", true),
    markerColor: cfg.get<string>("markerColor", "#FF6B6B"),
    showToastOnJump: cfg.get<boolean>("showToastOnJump", true),
  };
}
