export function nodeForEach<T extends Node>(nodeList: NodeList, callback: (value: T, index: number, source: NodeList) => void): void {
  Array.prototype.forEach.call(nodeList, callback);
}
