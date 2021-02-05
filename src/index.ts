import * as vscode from "vscode";
import { MobxConsoleLogger } from "@knuddels/mobx-logger";
import * as mobx from "mobx";
import { Extension } from "./Extension";
import { TreeViewProvider } from './TreeViewProvider';

if (process.env.DEV === "1") {
	new MobxConsoleLogger(mobx);
}

export function activate(context: vscode.ExtensionContext) {
	darwinTraining();
	context.subscriptions.push(new Extension(context));

};

function darwinTraining() {

	let treeview = TreeViewProvider.initTreeViewItem("treeView-item");
	let treeviewHome = vscode.window.createTreeView("treeView-item", { treeDataProvider: treeview });

	let proj_desc_info = {
		"project_name": "",
		"project_type": "",
		"python_type": "",
		"ann_lib_type": ""
	};


	let currentPanel: vscode.WebviewPanel | undefined = undefined;
	let disposable2 = vscode.commands.registerCommand("treeView-item.newproj", () => {
		console.log(" create new project");
		if (currentPanel) {
			currentPanel.webview.postMessage({ "command": "CreateNewProject" });
		}
	});

}

export function deactivate() { }
