import { describe, it, expect } from 'vitest';
import packageJson from '../../package.json';

// Two tests to ensure that the development environment doesn't change unintentionally.

const expectedDependencies = {
        "@capacitor/android": "^5.6.0",
        "@capacitor/core": "^5.6.0",
        "@capacitor/ios": "^5.6.0",
        "@headlessui/react": "^1.7.18",
        "@heroicons/react": "^2.1.1",
        "@pixi/react": "^7.1.1",
        "@supabase/supabase-js": "^2.39.3",
        "pixi.js": "^7.4.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.22.0"
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
        "autoprefixer": "^10.4.17",
        "eslint": "^8.55.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-react-refresh": "^0.4.5",
        "jest": "^29.7.0",
        "jest-environment-jsdom": "^29.7.0",
        "jsdom": "^24.0.0",
        "postcss": "^8.4.33",
        "tailwindcss": "^3.4.1",
        "ts-jest": "^29.1.2",
        "typescript": "^5.2.2",
        "vite": "^5.0.8",
        "vitest": "^1.2.2"
};

describe('Dependencies Test', () => {
        it('should match the specified dependencies versions', () => {
                expect(packageJson.dependencies).toEqual(expectedDependencies);
        });

        it('should match the specified devDependencies versions', () => {
                expect(packageJson.devDependencies).toEqual(expectedDevDependencies);
        });
});
