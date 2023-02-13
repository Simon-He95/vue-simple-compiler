import { join } from "path";
import { ensureDirSync, writeFileSync, rmSync, existsSync } from "fs-extra";
import { beforeEach, expect, it } from "vitest";
import { defineComponent } from "vue";
import { render } from "@testing-library/vue";

import { compile } from "../src/compiler";
import * as fixtures from "./fixtures";

// TODO:
// features
// - options: custom resolver
// - multiple style blocks
// - multiple script blocks
// complexity
// - import vue files without extension name
// - import js/css files with the same name

const testDistDir = "./test/dist";

beforeEach(() => {
  document.body.innerHTML = "";
});

it("works", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.mvp);
  expect(destFilename).toBe("anonymous.vue.js");
  expect(css.length).toBe(1);
  expect(externalJs.length).toBe(0);
  expect(externalCss.length).toBe(0);
  expect(css[0].filename).toBe("anonymous.vue.css");
  expect(css[0].content).toBeTruthy();
  const dir = join(testDistDir, "mvp");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  const HelloWorld = (await import(modulePath)).default;
  const result = render(defineComponent(HelloWorld));
  expect(result.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello World!</h1><input>"
  );
});

it("works without <style>", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.nonCss);
  expect(destFilename).toBe("anonymous.vue.js");
  expect(css.length).toBe(0);
  expect(externalJs.length).toBe(0);
  expect(externalCss.length).toBe(0);
  const dir = join(testDistDir, "non-css");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = render(defineComponent(HelloWorld));
  expect(wrapper.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello World!</h1><input>"
  );
});

it("works with custom filename", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.mvp, { filename: "custom.vue" });
  expect(destFilename).toBe("custom.vue.js");
  expect(css.length).toBe(1);
  expect(css[0].filename).toBe("custom.vue.css");
  expect(css[0].content).toBeTruthy();
  const dir = join(testDistDir, "custom-filename");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = render(defineComponent(HelloWorld));
  expect(wrapper.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello World!</h1><input>"
  );
});

it("works with <script setup>", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.setup, { filename: "setup.vue" });
  expect(destFilename).toBe("setup.vue.js");
  expect(css.length).toBe(1);
  expect(css[0].filename).toBe("setup.vue.css");
  expect(css[0].content).toBeTruthy();
  const dir = join(testDistDir, "setup");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  const HelloWorld = (await import(modulePath)).default;
  const result = render(defineComponent(HelloWorld));
  expect(result.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello World!</h1><input>"
  );
});

it("works with typescript", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.ts, { filename: "ts.vue" });
  expect(destFilename).toBe("ts.vue.js");
  expect(css.length).toBe(0);
  const dir = join(testDistDir, "ts");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  const HelloWorld = (await import(modulePath)).default;
  const result = render(defineComponent(HelloWorld));
  expect(result.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello from Component A!</h1>"
  );
});

it("works with importing other vue files", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.mvp, { filename: "foo.vue", autoResolveImports: true });
  const {
    js: { filename: destFilename2, content: jsCode2 },
    css: css2,
  } = compile(fixtures.imports, {
    filename: "bar.vue",
    autoResolveImports: true,
  });
  expect(destFilename).toBe("foo.vue.js");
  expect(destFilename2).toBe("bar.vue.js");
  expect(css.length).toBe(1);
  expect(css2.length).toBe(1);
  expect(css[0].content).toBeTruthy();
  expect(css2[0].content).toBeTruthy();
  const dir = join(testDistDir, "imports");
  const modulePath = join(dir, destFilename);
  const modulePath2 = join(dir, destFilename2);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  writeFileSync(modulePath2, jsCode2);
  writeFileSync(join(dir, css2[0].filename), css2[0].content);
  const Bar = (await import(modulePath2)).default;
  const wrapper = render(defineComponent(Bar));
  expect(wrapper.html().trim().replace(/\n/g, "")).toBe(
    "1<h1>Hello World!</h1><input>2"
  );
});

it("works with auto-import css", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.mvp, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(1);
  expect(externalJs.length).toBe(0);
  expect(externalCss.length).toBe(0);
  expect(css[0].content).toBeTruthy();
  expect(jsCode.includes(`import './foo.vue.css'`)).toBe(true);
  const dir = join(testDistDir, "auto-import-css");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = render(defineComponent(HelloWorld));
  expect(wrapper.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello World!</h1><input>"
  );
});

it("works with auto-import css without <style>", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.nonCss, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(0);
  expect(jsCode.includes(`import './foo.vue.css'`)).toBe(false);
  const dir = join(testDistDir, "auto-import-non-css");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = render(defineComponent(HelloWorld));
  expect(wrapper.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello World!</h1><input>"
  );
});

it("works with scoped CSS", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.scoped, { filename: "scoped.vue" });
  expect(destFilename).toBe("scoped.vue.js");
  expect(css.length).toBe(1);
  expect(css[0].content).toBeTruthy();
  expect(css[0].filename).toBe("scoped.vue.css");
  const dir = join(testDistDir, "scoped");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = await render(defineComponent(HelloWorld));
  const rootElement = wrapper.baseElement.firstElementChild!;
  expect(rootElement.childElementCount).toEqual(2);
  expect(rootElement.children[0].tagName).toEqual("H1");
  expect(rootElement.children[0].className).toEqual("title");
  expect(rootElement.children[0].textContent).toEqual("Hello World!");
  expect(rootElement.children[0].attributes.item(0)!.name).toMatch(
    /^data\-v\-/
  );
  expect(rootElement.children[1].tagName).toEqual("INPUT");
  expect(rootElement.children[1].attributes.item(0)!.name).toEqual(
    rootElement.children[0].attributes.item(0)!.name
  );
  expect(css[0].content).toMatch(
    rootElement.children[0].attributes.item(0)!.name
  );
});

it("works with CSS Modules", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.cssModules, {
    filename: "css.modules.vue",
    autoImportCss: true,
  });
  expect(destFilename).toBe("css.modules.vue.js");
  expect(css.length).toBe(1);
  expect(css[0].content).toBeTruthy();
  expect(css[0].filename).toBe("css.modules.vue.0.module.css");
  const dir = join(testDistDir, "css-modules");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  const HelloWorld = (await import(modulePath)).default;
  expect(HelloWorld).toHaveProperty("__cssModules");
  const wrapper = await render(defineComponent(HelloWorld));
  const rootElement = wrapper.baseElement.firstElementChild!;
  expect(rootElement.childElementCount).toEqual(2);
  expect(wrapper.getByText('Am I red?').classList.length).toEqual(1)
  expect(wrapper.getByText('Red and bold').classList.length).toEqual(2)
  expect(wrapper.getByText('Red and bold').classList[0]).toEqual(wrapper.getByText('Am I red?').classList[0])
});

it("works with CSS Modules without auto-import-css", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.cssModules, {
    filename: "css.modules.vue",
  });
  expect(destFilename).toBe("css.modules.vue.js");
  expect(css.length).toBe(1);
  expect(css[0].content).toBeTruthy();
  expect(css[0].filename).toBe("css.modules.vue.0.module.css");
  const dir = join(testDistDir, "css-modules-without-auto-import-css");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  const HelloWorld = (await import(modulePath)).default;
  expect(HelloWorld).toHaveProperty("__cssModules");
  const wrapper = await render(defineComponent(HelloWorld));
  const rootElement = wrapper.baseElement.firstElementChild!;
  expect(rootElement.childElementCount).toEqual(2);
  expect(wrapper.getByText('Am I red?').className).toEqual('red')
  expect(wrapper.getByText('Red and bold').className).toEqual('red bold')
});

it("works with sass", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
  } = compile(fixtures.sass, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(1);
  expect(css[0].content).toBeTruthy();
  expect(jsCode.includes(`import './foo.vue.css'`)).toBe(true);
  const dir = join(testDistDir, "sass");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = render(defineComponent(HelloWorld));
  expect(wrapper.baseElement.querySelectorAll("a").length).toBe(3);
});

it("works with external js", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.externalJs, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(1);
  expect(externalJs.length).toBe(1);
  expect(externalJs[0].filename).toBe('./external.js')
  expect(externalJs[0].query).toEqual({})
  expect(externalCss.length).toBe(0);
  expect(css[0].content).toBeTruthy();
  expect(jsCode.includes(`import './foo.vue.css'`)).toBe(true);
  const dir = join(testDistDir, "external-js");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, css[0].filename), css[0].content);
  writeFileSync(join(dir, './external.js'), fixtures.externalJsAsset);
  const HelloWorld = (await import(modulePath)).default;
  const result = render(defineComponent(HelloWorld));
  expect(result.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello World!</h1><input>"
  );
});

it("works with external ts", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.externalTs, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(0);
  expect(externalJs.length).toBe(1);
  expect(externalJs[0].filename).toBe('./external.ts')
  expect(externalJs[0].query).toEqual({})
  expect(externalCss.length).toBe(0);
  const dir = join(testDistDir, "external-ts");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, './external.ts'), fixtures.externalTsAsset);
  const HelloWorld = (await import(modulePath)).default;
  const result = render(defineComponent(HelloWorld));
  expect(result.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello from Component A!</h1>"
  );
});

it("works with external css", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.externalCss, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(0);
  expect(externalJs.length).toBe(0);
  expect(externalCss.length).toBe(1);
  expect(externalCss[0].filename).toBe('./external.css')
  expect(externalCss[0].query).toEqual({})
  expect(jsCode.includes(`import './external.css'`)).toBe(true);
  const dir = join(testDistDir, "external-css");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, './external.css'), fixtures.externalCssAsset);
  const HelloWorld = (await import(modulePath)).default;
  const result = render(defineComponent(HelloWorld));
  expect(result.html().trim().replace(/\n/g, "")).toBe(
    "<h1>Hello World!</h1><input>"
  );
});

it("works with external sass", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.externalSass, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(0);
  expect(externalJs.length).toBe(0);
  expect(externalCss.length).toBe(1);
  expect(externalCss[0].filename).toBe('./external.scss')
  expect(externalCss[0].query).toEqual({})
  expect(jsCode.includes(`import './external.scss'`)).toBe(true);
  const dir = join(testDistDir, "external-sass");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, './external.scss'), fixtures.externalSassAsset);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = render(defineComponent(HelloWorld));
  expect(wrapper.baseElement.querySelectorAll("a").length).toBe(3);
});

it("works with external scoped css", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.externalScoped, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(0);
  expect(externalJs.length).toBe(0);
  expect(externalCss.length).toBe(1);
  expect(externalCss[0].filename).toBe('./external.css')
  expect(externalCss[0].query.scoped).toEqual("true")
  expect(externalCss[0].query.id).toBeTruthy()
  expect(jsCode.includes(`import './external.css?scoped=true&id=${
    externalCss[0].query.id
  }'`)).toBe(true);
  const dir = join(testDistDir, "external-scoped");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, './external.css'), fixtures.externalScopedAsset);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = render(defineComponent(HelloWorld));
  const rootElement = wrapper.baseElement.firstElementChild!;
  expect(rootElement.childElementCount).toEqual(2);
  expect(rootElement.children[0].tagName).toEqual("H1");
  expect(rootElement.children[0].className).toEqual("title");
  expect(rootElement.children[0].textContent).toEqual("Hello World!");
  expect(rootElement.children[0].attributes.item(0)!.name).toMatch(
    /^data\-v\-/
  );
  expect(rootElement.children[1].tagName).toEqual("INPUT");
  expect(rootElement.children[0].attributes.item(0)!.name).toMatch(
    externalCss[0].query.id
  );
  expect(rootElement.children[1].attributes.item(0)!.name).toEqual(
    rootElement.children[0].attributes.item(0)!.name
  );
});

it("works with external css modules", async () => {
  const {
    js: { filename: destFilename, content: jsCode },
    css,
    externalJs,
    externalCss,
  } = compile(fixtures.externalCssModules, { filename: "foo.vue", autoImportCss: true });
  expect(destFilename).toBe("foo.vue.js");
  expect(css.length).toBe(0);
  expect(externalJs.length).toBe(0);
  expect(externalCss.length).toBe(1);
  expect(externalCss[0].filename).toBe('./external.module.css')
  expect(externalCss[0].query).toEqual({ module: "true" })
  expect(jsCode.includes(`import style0 from './external.module.css?module=true'`)).toBe(true);
  const dir = join(testDistDir, "external-css-modules");
  const modulePath = join(dir, destFilename);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
  ensureDirSync(dir);
  writeFileSync(modulePath, jsCode);
  writeFileSync(join(dir, './external.module.css'), fixtures.externalCssModulesAsset);
  const HelloWorld = (await import(modulePath)).default;
  const wrapper = render(defineComponent(HelloWorld));
  const rootElement = wrapper.baseElement.firstElementChild!;
  expect(rootElement.childElementCount).toEqual(2);
  expect(wrapper.getByText('Am I red?').classList.length).toEqual(1)
  expect(wrapper.getByText('Red and bold').classList.length).toEqual(2)
  expect(wrapper.getByText('Am I red?').classList[0]).toEqual(wrapper.getByText('Red and bold').classList[0])
});
