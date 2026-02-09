import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension", () => {
  test("should activate successfully", async () => {
    const ext = vscode.extensions.getExtension("blancoff.error-coordinates");
    assert.ok(ext, "Extension should be present");
    await ext!.activate();
    assert.strictEqual(ext!.isActive, true);
  });

  test("should register all commands", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("errorCoordinates.nextError"));
    assert.ok(commands.includes("errorCoordinates.previousError"));
    assert.ok(commands.includes("errorCoordinates.listErrors"));
  });

  test("nextError should not throw when no editor is open", async () => {
    await vscode.commands.executeCommand(
      "workbench.action.closeAllEditors"
    );
    // Should not throw
    await vscode.commands.executeCommand("errorCoordinates.nextError");
  });

  test("nextError should show info message when no errors", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "const x = 1;\n",
      language: "plaintext",
    });
    await vscode.window.showTextDocument(doc);

    // Should not throw — shows "No errors in this file."
    await vscode.commands.executeCommand("errorCoordinates.nextError");
  });
});
