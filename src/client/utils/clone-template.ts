const _cache: Record<string | symbol, HTMLTemplateElement> = {};

const cache = new Proxy(_cache, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }

    const template = document.querySelector<HTMLTemplateElement>(String(prop));
    if (!template) {
      throw new Error(`Template not found: ${String(prop)}`);
    }
    if (!(template instanceof HTMLTemplateElement)) {
      throw new Error(`Element is not a template: ${String(prop)}`);
    }

    target[prop] = template;

    return template;
  },
});

const cloneTemplate = <T extends HTMLElement>(templateSelector: string): T => {
  return cache[templateSelector].content.cloneNode(true) as T;
};

export { cloneTemplate };
