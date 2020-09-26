// Code copied from "topological-sort" npm module

/*
The MIT License (MIT)

Copyright (c) 2013 Dmitry Sorin <info@staypositive.ru>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function assert(value: boolean, msg: string): void {
  if (!value) throw new Error(msg);
}

export interface INodeWithChildren<KeyType, ValueType> {
  children: InternalNodesMap<KeyType, ValueType>;
  node: ValueType;
}

export type InternalNodesMap<KeyType, ValueType> = Map<
  KeyType,
  INodeWithChildren<KeyType, ValueType>
>;

export class TopologicalSort<KeyType, ValueType> {
  private nodes: InternalNodesMap<KeyType, ValueType>;
  private visitedNodes!: Set<INodeWithChildren<KeyType, ValueType>>;
  private sortedKeysStack!: KeyType[];

  constructor(nodes: Map<KeyType, ValueType>) {
    this.nodes = new Map();
    this.addMultipleInternalNodes(nodes);
  }

  addNode(key: KeyType, node: ValueType): this {
    return this.addInternalNode(key, node);
  }

  addNodes(nodes: Map<KeyType, ValueType>): void {
    this.addMultipleInternalNodes(nodes);
  }

  addEdge(fromKey: KeyType, toKey: KeyType): void {
    assert(this.nodes.has(fromKey), `Source node with ${fromKey} key should exist`);
    assert(this.nodes.has(toKey), `Target node with ${toKey} key should exist`);

    const sourceNode = this.nodes.get(fromKey);
    const targetNode = this.nodes.get(toKey);

    assert(sourceNode !== undefined, `Source node with key ${fromKey} doesn't exist`);
    assert(targetNode !== undefined, `Target node with key ${toKey} doesn't exist`);

    assert(
      !sourceNode!.children.has(toKey),
      `Source node ${fromKey} already has an adge to target node ${toKey}`,
    );

    sourceNode!.children.set(toKey, targetNode!);
  }

  sort(): Map<KeyType, INodeWithChildren<KeyType, ValueType>> {
    this.visitedNodes = new Set();
    this.sortedKeysStack = [];
    const output = new Map<KeyType, INodeWithChildren<KeyType, ValueType>>();

    for (const [key] of this.nodes) {
      this.exploreNode(key, []);
    }

    for (let i = this.sortedKeysStack.length - 1; i >= 0; i--) {
      const node = this.nodes.get(this.sortedKeysStack[i])!;
      output.set(this.sortedKeysStack[i], node);
    }

    return output;
  }

  private exploreNode(nodeKey: KeyType, explorePath: KeyType[]): void {
    const newExplorePath = [...explorePath, nodeKey];

    // we should check circular dependencies starting from node 2
    if (explorePath.length) {
      assert(
        !explorePath.includes(nodeKey),
        `Node ${nodeKey} forms circular dependency: ${newExplorePath.join(' -> ')}`,
      );
    }

    const node = this.nodes.get(nodeKey);
    if (this.visitedNodes.has(node!)) {
      return;
    }

    // mark node as visited so that it and its children
    // won't be explored next time
    this.visitedNodes.add(node!);

    for (const [childNodeKey] of node!.children) {
      this.exploreNode(childNodeKey, newExplorePath);
    }

    this.sortedKeysStack.push(nodeKey);
  }

  private addInternalNode(key: KeyType, node: ValueType): this {
    assert(!this.nodes.has(key), `Node ${key} already exists`);

    this.nodes.set(key, {
      children: new Map(),
      node,
    });

    return this;
  }

  private addMultipleInternalNodes(nodes: Map<KeyType, ValueType>): void {
    const nodesFlat = [...nodes];

    for (let i = nodes.size - 1; i >= 0; i--) {
      const [key, node] = nodesFlat[i];
      this.addInternalNode(key, node);
    }
  }
}
