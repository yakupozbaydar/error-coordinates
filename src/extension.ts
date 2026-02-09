import * as vscode from "vscode";
import { DiagnosticCollector } from "./diagnosticCollector";
import { DecorationManager } from "./decorationManager";
import { NavigationController } from "./navigationController";

export function activate(context: vscode.ExtensionContext): void {
  const collector = new DiagnosticCollector();
  const decorationManager = new DecorationManager(collector, context);
  const navigationController = new NavigationController(collector);

  context.subscriptions.push(
    collector,
    decorationManager,
    navigationController
  );
}

export function deactivate(): void {
  // Disposables are cleaned up via context.subscriptions
}
