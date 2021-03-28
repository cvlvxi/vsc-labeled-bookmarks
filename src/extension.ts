import * as vscode from 'vscode';
import { ExtensionContext, Range, TextEditor, TextEditorDecorationType, Uri } from 'vscode';
import { Group } from "./group";

let ctx: ExtensionContext;
let savedGroupsKey = "vscLabeledBookmarks.groups";
let savedActiveGroupKey = "vscLabeledBookmarks.activeGroup";

let groups: Map<string, Group>;
let activeGroup: string;
let defaultGroupLabel: string;
let fallbackColor: string;

let colors: Array<string>;

// class PickItem implements QuickPickItem {
//	import { QuickPickItem } from 'vscode';
// 	label: string;
// 	description: string;
// 	detail: string;
// 	constructor(label: string, description: string, detail: string) {
// 		this.label = label;
// 		this.description = description;
// 		this.detail = detail;
// 	}
// }

export function activate(context: ExtensionContext) {
	ctx = context;
	groups = new Map<string, Group>();
	defaultGroupLabel = "default";
	activeGroup = defaultGroupLabel;
	fallbackColor = "ff6666";

	colors = [
		"ffee66",
		"ee66ff",
		"66ffee",
		"77ff66",
		"ff6677",
		"6677ff"
	];

	if (colors.length < 1) {
		colors.push(fallbackColor);
	}

	let svgDir = Uri.joinPath(ctx.globalStorageUri, "svg");
	vscode.workspace.fs.createDirectory(svgDir).then(() => {
		Group.svgDir = svgDir;

		// groups = ctx.workspaceState.get(savedGroupsKey) ?? new Map<string, Group>();

		groups = new Map<string, Group>();
		activeGroup = ctx.workspaceState.get(savedActiveGroupKey) ?? defaultGroupLabel;
		activateGroup(activeGroup);

		// vscode.window.showInformationMessage("initializing group decorations");
		// for (let [_, group] of groups) {
		// 	group.initDecorations();
		// 	vscode.window.showInformationMessage("one done");
		// }

		let disposable = vscode.commands.registerTextEditorCommand('vsc-labeled-bookmarks.toggleBookmark', (textEditor) => {
			if (textEditor.selections.length === 0) {
				return;
			}

			let lineNumber = textEditor.selection.start.line;
			let documentUri = textEditor.document.uri;

			let group = groups.get(activeGroup);
			if (typeof group === "undefined") {
				return;
			}

			group.toggleBookmark(documentUri, lineNumber);

			updateDecorations(textEditor);

			// show quick pick
			// let selected = vscode.window.showQuickPick([
			// 	"alma - korte/zebra.php 123",
			// 	"korte - zebra/alma.php 4",
			// 	"zebra - alma/korte.php 2",
			// 	"a1 - somefile 1"
			// ], {
			// 	canPickMany: true
			// });

			// let a = new PickItem('lab', 'desc', 'det');

			// let selected = vscode.window.showQuickPick([
			// 	a
			// ], {
			// 	canPickMany: true
			// });

			// show quick input
			// let input = vscode.window.showInputBox({ placeHolder: "pholder", prompt: "prompt\nmultiline" });

			// open a file
			// let doc = await vscode.workspace.openTextDocument('C:/Users/Balu/vimfiles/syntax/go.vim'); // calls back into the provider
			// await vscode.window.showTextDocument(doc, { preview: false });

			// go to line
			// let editor2 = vscode.window.activeTextEditor;
			// if (typeof editor2 !== 'undefined') {
			// 	let range = editor2.document.lineAt(4).range;
			// 	editor2.selection = new vscode.Selection(range.start, range.start);
			// 	editor2.revealRange(range);
			// }

			// status bar item
			// let statusBarWorkspaceLabel = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
			// statusBarWorkspaceLabel.text = '$(bookmark) group: temp';
			// statusBarWorkspaceLabel.tooltip = 'tooltip';
			// statusBarWorkspaceLabel.show();
			// statusBarWorkspaceLabel.text = '$(bookmark) group: another';

			ctx.subscriptions.push(disposable);
		});
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
	saveSettings();
}

function saveSettings() {
	ctx.workspaceState.update(savedGroupsKey, JSON.stringify(groups.entries()));
	ctx.workspaceState.update(savedActiveGroupKey, activeGroup);

}

function ensureGroup(label: string) {
	if (groups.has(label)) {
		return;
	}

	let group = Group.factory(label, getLeastUsedColor(), new Date());
	groups.set(label, group);
}

function activateGroup(label: string) {
	ensureGroup(label);
	activeGroup = label;
	saveSettings();
	//todo update statusbar
}

function getLeastUsedColor(): string {
	if (colors.length < 1) {
		return fallbackColor;
	}

	let usages = new Map<string, number>();

	for (let color of colors) {
		usages.set(color, 0);
	}

	for (let [_, group] of groups) {
		let groupColor = group.getColor();
		if (usages.has(groupColor)) {
			usages.set(groupColor, (usages.get(groupColor) ?? 0) + 1);
		}
	}

	let minUsage = Number.MAX_SAFE_INTEGER;
	let leastUsedColor = "";

	for (let [key, value] of usages) {
		if (minUsage > value) {
			minUsage = value;
			leastUsedColor = key;
		}
	}

	return leastUsedColor;
}

function updateDecorations(textEditor: TextEditor) {
	let documentUri = textEditor.document.uri;
	let decoration: TextEditorDecorationType | undefined;
	for (let [label, group] of groups) {
		if (label === activeGroup) {
			decoration = group.decoration;
		} else {
			decoration = group.inactiveDecoration;
		}

		if (typeof decoration === "undefined") {
			vscode.window.showErrorMessage("missing decoration in bookmark group '" + label + "'");
			continue;
		}

		let ranges: Array<Range> = [];
		for (let bookmark of group.getBookmarksOfUri(documentUri)) {
			ranges.push(new Range(bookmark.line, 0, bookmark.line, 0));
		}
		textEditor.setDecorations(decoration, ranges);
	}
}