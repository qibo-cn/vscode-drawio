import * as vscode from "vscode";
import * as log from "loglevel";
import { MobxConsoleLogger } from "@knuddels/mobx-logger";
import * as mobx from "mobx";
import { Extension } from "./Extension";
import { TreeViewProvider, addSlfFile, addSlfProj, TreeItemNode } from './TreeViewProvider';
import * as fs from "fs";
import * as path from "path";
import { projectCreate } from "./projectCreate";

log.setLevel(0);// "silent"

if (process.env.DEV === "1") {
	new MobxConsoleLogger(mobx);
}


function darwinTraining(context: vscode.ExtensionContext) {

	let treeview = TreeViewProvider.initTreeViewItem("treeView-item");
	log.info(treeview);
	let treeviewHome = vscode.window.createTreeView("treeView-item", { treeDataProvider: treeview });
	log.info(treeviewHome);

	let proj_desc_info = {
		"project_name": "",
		"project_type": "",
		"python_type": "",
		"ann_lib_type": ""
	};

	let inMemTreeViewStruct: Array<TreeItemNode> = new Array();
	let trainData: string | undefined = undefined;
	let testData: string | undefined = undefined;
	let dataLabel: string | undefined = undefined;
	let model_file_path: string | undefined = undefined;

	let darwinlang_file_paths: Array<String> = new Array();
	let darwinlang_bin_paths: Array<String> = new Array();

	let currentPanel: vscode.WebviewPanel | undefined = undefined;
	let training = vscode.commands.registerCommand("training", () => {
		const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
		treeviewHome.reveal(treeview.data[0]);
		log.info(treeview.data[0]);
		if (currentPanel) {
			currentPanel.reveal(columnToShowIn);
		} else {
			currentPanel = vscode.window.createWebviewPanel("darwin2web", "trainings", vscode.ViewColumn.One, { localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath))], enableScripts: true, retainContextWhenHidden: true });
			// 主界面由electron 应用启动
			currentPanel.webview.html = projectCreate();
			var projectSavedDir = '';
			currentPanel.webview.onDidReceiveMessage(function (msg) {
				console.log("Receive message: " + msg);
				let data = JSON.parse(msg);
				log.info(data);
				if (data.projectSaveDirSelect === true) {
					const projectSaveDiroptions: vscode.OpenDialogOptions = {
						canSelectMany: false,
						openLabel: 'Select',
						canSelectFiles: false,
						canSelectFolders: true
					};
					vscode.window.showOpenDialog(projectSaveDiroptions).then(fileUri => {
						if (fileUri && fileUri[0]) {
							log.info('Selected file: ' + fileUri[0].fsPath);
							projectSavedDir = fileUri[0].fsPath;
						}
					});
				}
				log.info(projectSavedDir);
				if (data.project_info) {
					// 接收到webview 项目创建向导的消息，创建新的项目
					console.log("receive project create info");
					console.log("project name: " + data.project_info.project_name + ", project type=" + data.project_info.project_type
						+ ", python_type: " + data.project_info.python_type + ", ann lib type:" + data.project_info.ann_lib_type);
					proj_desc_info.project_name = data.project_info.project_name;
					proj_desc_info.project_type = data.project_info.project_type;
					proj_desc_info.python_type = data.project_info.python_type;
					proj_desc_info.ann_lib_type = data.project_info.ann_lib_type;
					addSlfProj(data.project_info.project_name);
					inMemTreeViewStruct.push(new TreeItemNode(data.project_info.project_name, [new TreeItemNode("数据",
						[new TreeItemNode("训练数据", []), new TreeItemNode("测试数据", []),
						new TreeItemNode("测试数据标签", [])]), new TreeItemNode("ANN模型", [])]));
					treeview.data = inMemTreeViewStruct;
					// TODO 写入项目信息
					let projectInfo = {
						"proj_info": proj_desc_info,
						"trainData": trainData,
						"testData": testData,
						"dataLabel": dataLabel,
						"model_path": model_file_path,
						"darwinlang_file_paths": darwinlang_file_paths,
						"darwinlang_bin_paths": darwinlang_bin_paths
					};
					createTemplateProject(projectSavedDir, proj_desc_info.project_name, JSON.stringify(projectInfo));
					var createdProjectUri = vscode.Uri.file(projectSavedDir + '/' + proj_desc_info.project_name);
					log.info(createdProjectUri);
					log.info({ uri: createdProjectUri, name: "newProject" });
					log.info(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0);
					vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: createdProjectUri, name: proj_desc_info.project_name });
					treeview.refresh();
				}
			})
		};

	});
	context.subscriptions.push(training);
	let newPoject = vscode.commands.registerCommand("treeView-item.newproj", () => {
		log.info(newPoject);
		log.info(" create new project");
		if (currentPanel) {
			currentPanel.webview.postMessage({ "command": "CreateNewProject" });
		}
	});
	context.subscriptions.push(newPoject);

	context.subscriptions.push(vscode.commands.registerCommand("treeView.proj_rename", () => {
		log.info("项目属性修改");
		// 发消息到webview
		if (currentPanel) {
			currentPanel.webview.postMessage({ "command": "ProjectRefactor", "project_desc": proj_desc_info });
		}
	}));

	//项目保存
	context.subscriptions.push(vscode.commands.registerCommand("treeView.proj_save", () => {
		const options: vscode.SaveDialogOptions = {
			saveLabel: "保存项目",
			filters: { "Darwin2 Project": ['dar2'] }
		};
		vscode.window.showSaveDialog(options).then(fileUri => {
			if (fileUri && fileUri) {
				console.log("selected path: " + fileUri.fsPath);
				// TODO 写入项目信息
				let data = {
					"proj_info": proj_desc_info,
					"trainData": trainData,
					"testData": testData,
					"dataLabel": dataLabel,
					"model_path": model_file_path,
					"darwinlang_file_paths": darwinlang_file_paths,
					"darwinlang_bin_paths": darwinlang_bin_paths
				};
				fs.writeFileSync(fileUri.fsPath, JSON.stringify(data));
			}
		});
	}));
	vscode.commands.executeCommand("training");
}
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(new Extension(context));
	darwinTraining(context);

};

function createTemplateProject(dir: string, projectName: string, projectConfig: string) {
	fs.mkdir(path.join(dir + '/' + projectName), (error) => {
		log.info(path.join(dir + '/' + projectName));
		if (error) {
			log.error(error);
		} else {
			fs.writeFile(path.join(dir + '/' + projectName + '/package.json'), projectConfig, (error) => {
				log.info(path.join(dir + '/' + projectName + '/package.json'));
				if (error) {
					log.error(error);
				} else {
					log.info('project create success');
				}
			})
			fs.mkdir(path.join(dir + '/' + projectName + '/model'), (error) => {
				log.info(path.join(dir + '/' + projectName + '/model'));
				if (error) {
					log.error(error);
				} else {
					// TODO: 
					fs.writeFile(path.join(dir + '/' + projectName + '/model' + '/darwinlang.drawio'), '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>', (error) => {
						if (error) {
							log.error(error);
						}
					})
				}
			});
			fs.mkdir(path.join(dir + '/' + projectName + '/resource'), (error) => {
				log.info(path.join(dir + '/' + projectName + '/resource'));
				if (error) {
					log.error(error);
				}
			});
		}
	});
}

export function deactivate() { }
