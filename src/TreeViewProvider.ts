import { TreeItem, TreeItemCollapsibleState, TreeDataProvider, Uri, window } from 'vscode';
import * as vscode from 'vscode';
import { join } from 'path';



export let ITEM_ICON_MAP = new Map<string, string>([
    ['项目', 'imgs/project.png'],
    ['数据', 'imgs/import_data.png'],
    ['ANN模型', 'imgs/import_model.png'],
    ['训练数据', "imgs/file.png"],
    ['测试数据', "imgs/file.png"],
    ['测试数据标签', "imgs/file.png"]
    // ['转换与仿真',"imgs/simulate_run.png"],
    // ['测试添加',"imgs/simulate_run.png"]
]);

// 第一步：创建单项的节点(item)的类
export class TreeItemNode extends TreeItem {

    constructor(
        // readonly 只可读
        public label: string,
        public children?: TreeItemNode[],
        public readonly isRoot?: boolean
    ) {
        super(label, children === undefined ? vscode.TreeItemCollapsibleState.None :
            vscode.TreeItemCollapsibleState.Expanded);
        this.children = children ? children : [];
        // this.contextValue = isRoot ? "TreeViewProviderContext":undefined;
        this.contextValue = label;
    }

    // command: 为每项添加点击事件的命令
    command = {
        title: this.label,          // 标题
        command: 'itemClick',       // 命令 ID
        // tooltip: this.label,        // 鼠标覆盖时的小小提示框
        arguments: [                // 向 registerCommand 传递的参数。
            this.label,             // 目前这里我们只传递一个 label
        ]
    };

    // iconPath： 为该项的图标因为我们是通过上面的 Map 获取的，所以我额外写了一个方法，放在下面
    iconPath = TreeItemNode.getIconUriForLabel(this.label);

    // __filename：当前文件的路径
    // 重点讲解 Uri.file(join(__filename,'..', '..') 算是一种固定写法
    // Uri.file(join(__filename,'..','assert', ITEM_ICON_MAP.get(label)+''));   写成这样图标出不来
    // 所以小伙伴们就以下面这种写法编写
    static getIconUriForLabel(label: string): Uri {
        console.log("path:" + Uri.file(join(__filename, '..', "resources", ITEM_ICON_MAP.get(label) + '')).toString());
        return Uri.file(join(__filename, '..', "..", "src", "resources", ITEM_ICON_MAP.get(label) + ''));
    }
}


export class TreeViewProvider implements TreeDataProvider<TreeItemNode>{
    // 自动弹出的可以暂不理会

    data: TreeItemNode[];

    constructor() {
        this.data = [];
        // this.data = [new TreeItemNode("项目", [new TreeItemNode("数据", 
        // [new TreeItemNode("训练数据"), new TreeItemNode("测试数据"), new TreeItemNode("测试数据标签")]), new TreeItemNode("模型")])];
    }

    // 自动弹出
    // 获取树视图中的每一项 item,所以要返回 element
    getTreeItem(element: TreeItemNode): TreeItem | Thenable<TreeItem> {
        return element;
    }

    // 自动弹出，但是我们要对内容做修改
    // 给每一项都创建一个 TreeItemNode
    getChildren(element?: TreeItemNode | undefined): import("vscode").ProviderResult<TreeItemNode[]> {

        if (element === undefined) {
            return this.data;
        } else {
            return element.children;
        }
        // return ['新建项目','导入数据','导入模型','转换与仿真'].map(

        //     item => new TreeItemNode(
        //         item as string,
        //         TreeItemCollapsibleState.None as TreeItemCollapsibleState,
        //     )
        // );
    }

    getParent(element?: TreeItemNode | undefined): import("vscode").ProviderResult<TreeItemNode> {
        if (this.data.length === 0 || element === this.data[0]) {
            return undefined;
        } else {
            let parentNode = this.data[0];
            let stack = new Array();
            stack.push(parentNode);
            while (stack.length > 0) {
                let tmp_head: TreeItemNode = stack[0];
                stack.splice(0, 1);
                if (tmp_head.children) {
                    for (let i = 0; i < tmp_head.children.length; ++i) {
                        stack.push(tmp_head.children[i]);
                        if (tmp_head.children[i] === element) {
                            return parentNode;
                        }
                    }
                }
                parentNode = tmp_head;
            }
            return undefined;
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<TreeItemNode | undefined | null | void> = new vscode.EventEmitter<TreeItemNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItemNode | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    // 这个静态方法时自己写的，你要写到 extension.ts 也可以
    public static initTreeViewItem(target_view: string): TreeViewProvider {

        // 实例化 TreeViewProvider
        const treeViewProvider = new TreeViewProvider();

        // registerTreeDataProvider：注册树视图
        // 你可以类比 registerCommand(上面注册 Hello World)
        window.registerTreeDataProvider(target_view, treeViewProvider);
        return treeViewProvider;
    }
}