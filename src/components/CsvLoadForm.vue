<template>
    <div>
        <div class="csv-load-form">
            <input type="file" @change="onFileChange">
            <div class="tree-view">
                <el-tree :data="treeData" :render-content="renderContent" @node-contextmenu="contextMenu"></el-tree>
            </div>
            <div class="comment-popup" v-show="showComment"  :style="{transform: transform}" >{{comment}}</div>
            <div class="context-menu" v-show="showContextMenu" v-click-outside="hideMenu" :style="{transform: transform}">
                <ul v-show="!isAction">
                    <li @click="removeComment">Удалить comment</li>
                    <li @click="addComment" v-if="!isComment">Создать comment</li>
                    <li @click="addComment" v-else>Редактировать comment</li>
                </ul>
                <div v-if="isRedact"
                     :style="{transform: transform}"
                     style="{min-width: 400px; height: 40px; background: #9AB4D2; border: 1px solid #deeeee; border-radius: 2px}">
                    <el-form ref="form" label-width="200px" @keydown.enter.native="onFinish">
                        <el-form-item label="Введите комментарий">
                            <el-input v-model="contextMenuNode.comment"
                                      @blur="onFinish"
                                      @keydown.enter.native="onFinish"
                                      style="{'min-width': 100px}"
                                      />
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Papa from 'papaparse'
    import ClickOutside from 'vue-click-outside'

    export default {
        name: "CsvLoadForm",
        directives: {
            ClickOutside
        },
        data() {
            return {
                transform: undefined,
                isAction: false,
                contextMenuNode: null,
                showContextMenu: false,
                comment: undefined,
                showComment: false,
                treeData: []
            }
        },
        computed: {
            isRedact: function() {
                return this.contextMenuNode && this.isAction;
            },
            isComment: function() {
                return this.contextMenuNode && this.contextMenuNode.comment;
            }
        },
        methods: {
            renderContent(h, {node}) {
                let classes = [];
                node.data.removed && classes.push('removed');
                node.data.added && classes.push('added');
                const this_ = this;
                const handle = {
                    class: classes.join(" "),
                    on: {
                        'mouseenter': (evt) => {
                            this_.showComment = !!node.data.comment;
                            this_.comment = node.data.comment;
                            this.transform = `translate(${evt.x - 10}px, ${evt.y + 10}px)`;
                        },
                        'mouseleave': () => {
                            this_.showComment = false;
                            this_.comment = undefined;
                        }
                    }
                };

                return ('span', handle, [h('span', handle,  node.label + ' - ' + node.data.id)]);
            },
            onFileChange(e) {
                let files = e.target.files || e.dataTransfer.files;
                if (!files.length)
                    return;
                this.readFile(files[0]);
            },
            readFile(file) {
                const this_ = this;
                const  reader = new FileReader();
                reader.onload = () => {
                    Papa.parse(file, {
                        complete: function(results) {
                            this_.convertToTree(results.data);
                        }
                    });

                };
                reader.readAsDataURL(file);
            },
            findNode(id) {
                let node = this.treeData.filter(item => item.id === id);
                if (!node) {
                    this.treeData.find(item => {
                        const res = this.findInChildren(item.children);
                        if (res) {
                            node = res;
                        }
                    });
                }
                return node;
            },
            findInChildren(node, id) {
                const node_ = node.filter(item => item.id === id);
                if (!node_ && Array.isArray(node.children) && node.children.length > 0) {
                    this.findInChildren(node.children)
                }
                else {
                    return node_;
                }
            },
            setAsRemoved() {
                const setChildren = (node) => {
                    if (node &&  Array.isArray(node.children) && node.children.length > 0) {
                        node.children.forEach(item => item.removed = true)
                    }
                };

                this.treeData.forEach(item => {
                    item.removed = true;
                    setChildren(item);
                })
            },
            compareNodes(node1, node2) {
                return node1 && node2 && node1.id === node2.id && node1.label === node2.label;
            },
            convertToTree(arr) {
                if (this.treeData.length > 0 && arr[0][0] !== this.treeData[0].id) {
                    this.treeData = [];
                } else if (this.treeData.length > 0) {
                    this.setAsRemoved();
                }
                arr.forEach(row => {
                    const parentId = row[2];
                    const id = row[0];
                    const label = row[1];

                    // get parent array
                    let parent = this.findNode(parentId);
                    // if (parent's length > 1) choose first is not removed
                    parent = parent.find(item => !item.removed);
                    const nodeObject = {
                        id: id,
                        comment: undefined,
                        label: label,
                        children: [],
                        removed: false,
                        added: false,
                        modified: false
                    };
                    let node = parent && parent.children.find(item => item.id === id);
                    if (parent && this.compareNodes(nodeObject, node)) {
                        node.modified = true;
                        node.removed = false;
                        node.added = false;
                    } else if (parent && !this.compareNodes(nodeObject, node)) {
                        nodeObject.added = true;
                        nodeObject.removed = false;
                        parent.children.push(nodeObject);
                    } else {
                        node = this.treeData.find(item => item.id === id);
                        if (this.compareNodes(nodeObject, node)) {
                            node.modified = true;
                            node.removed = false;
                            node.added = false;
                        } else {
                            nodeObject.added = true;
                            nodeObject.removed = false;
                            this.treeData.push(nodeObject)
                        }
                    }
                })
            },
            contextMenu(evt, nodeData ) {
                evt.preventDefault();
                evt.stopPropagation();
                this.showContextMenu = true;
                this.contextMenuNode = nodeData;
                this.transform = `translate(${evt.x}px, ${evt.y}px)`;
            },
            removeComment() {
                this.contextMenuNode.comment = undefined;
                this.showContextMenu = false;
                this.contextMenuNode = null;
            },
            addComment() {
                this.isAction = true;
            },
            onFinish() {
                this.isAction = false;
                this.showContextMenu = false;
                this.contextMenuNode = null;
            },
            hideMenu() {
                if (this.showContextMenu) {
                    this.showContextMenu = false;
                }
            }
        }
    }
</script>

<style lang="scss" >
    .csv-load-form {
        position: absolute;
        left: 50px;
        top: 50px;
        z-index: 7000;
        .tree-view {
            max-height: 80vh;
            overflow: auto;
        }
        .comment-popup {
            position: absolute;
            min-width: 200px;
            left: 10px;
            top: -79px;
            background: #3b9cff;
            color: white;
            border-radius: 5px;
        }
        .context-menu {
            position: absolute;
            left: 10px;
            top: -79px;
            min-width: 200px;
            ul {
                width: 250px;
                li {
                    cursor: pointer;
                    background-color: #9AB4D2;
                    list-style: none;
                }
            }

        }
        .added {
            color: green;
        }
        .removed {
            color: red;
        }
    }
</style>