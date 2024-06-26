import { describe, it, expect } from "vitest";
import packageJson from "../../package.json";

/* Two tests to ensure that the development environment doesn't change unintentionally. */
// Why? During prototyping one of my test projects I did an npm fix, if I recall correctly,
// and it broke the entire project.
// Do not install dependencies without good reason. When you do, add them here.

const expectedDependencies = {
  "@capacitor/android": "^5.6.0",
  "@capacitor/core": "^5.6.0",
  "@capacitor/ios": "^5.6.0",
  "@headlessui/react": "^1.7.18",
  "@heroicons/react": "^2.1.1",
  "@hookform/resolvers": "^3.3.4",
  "@pixi/react": "^7.1.1",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-hover-card": "^1.0.7",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-progress": "^1.0.3",
  "@radix-ui/react-scroll-area": "^1.0.5",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-slot": "^1.0.2",
  "@supabase/supabase-js": "^2.39.3",
  "@tanstack/react-table": "^8.12.0",
  "@types/uuid": "^9.0.8",
  "animate.css": "^4.1.1",
  "class-variance-authority": "^0.7.0",
  clsx: "^2.1.0",
  "lucide-react": "^0.323.0",
  "pixi.js": "^7.4.0",
  react: "^18.2.0",
  "react-dom": "^18.2.0",
  "react-hook-form": "^7.50.1",
  "react-router-dom": "^6.22.0",
  "simple-icons": "^11.12.0",
  "tailwind-merge": "^2.2.1",
  "tailwindcss-animate": "^1.0.7",
  uuid: "^9.0.1",
  zod: "^3.22.4",
};

const expectedDevDependencies = {
  "@capacitor/cli": "^5.6.0",
  "@testing-library/jest-dom": "^6.4.1",
  "@testing-library/react": "^14.2.1",
  "@testing-library/user-event": "^14.5.2",
  "@types/jest": "^29.5.12",
  "@types/node": "^20.11.16",
  "@types/react": "^18.2.43",
  "@types/react-dom": "^18.2.17",
  "@typescript-eslint/eslint-plugin": "^6.14.0",
  "@typescript-eslint/parser": "^6.14.0",
  "@vitejs/plugin-react": "^4.2.1",
  autoprefixer: "^10.4.17",
  eslint: "^8.55.0",
  "eslint-config-prettier": "^9.1.0",
  "eslint-plugin-prettier": "^5.1.3",
  "eslint-plugin-react-hooks": "^4.6.0",
  "eslint-plugin-react-refresh": "^0.4.5",
  jest: "^29.7.0",
  "jest-environment-jsdom": "^29.7.0",
  jsdom: "^24.0.0",
  postcss: "^8.4.33",
  prettier: "^3.2.5",
  tailwindcss: "^3.4.1",
  "ts-jest": "^29.1.2",
  typescript: "^5.2.2",
  vite: "^5.0.8",
  vitest: "^1.2.2",
};

describe("Dependencies Test", () => {
  it("should match the specified dependencies versions", () => {
    expect(packageJson.dependencies).toEqual(expectedDependencies);
  });

  it("should match the specified devDependencies versions", () => {
    expect(packageJson.devDependencies).toEqual(expectedDevDependencies);
  });
});
