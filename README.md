# Project

This is a React project using Capacitor to port to native platforms with a focus on Android.

## Tools

- NodeJS
- Webstorm/VSCode
- Android Studio
    - SDK Manager
        - API level 34.
        - Build tools 33.0.2, 34.0.0
    - Virtual Device Manager
        - Android emulator: Android 13 or better.
- Java v17
    - JDK for native development.
- Gradle v8.5.0
    - Build system for native development.
- Docker
    - Web development and testing in a sanitized environment.
- React
    - Template made using Vite
    - For easy frontend development.
    - Using typescript template.
- Capacitor
    - Porting web app to native platforms.
- Supabase
    - BaaS (backend-as-service) for authentication and database.

# Development Commands

You will be running the app from the command line.

## Web dev:

The web development portion has working hot loading.

1. ``docker-compose up`` to start
2. ``docker-compose down -v`` to end.
    - Don't forget the -v flag. It's necessary to clean up volumes in Docker Hub.

## Open App on Android

1. ``npm run build`` Build React project
2. ``npx cap copy``
3. ``npx cap sync`` Superset of copy, just use both anyway.
4. ``npx cap run android`` Choose emulator from the list.

You can open the emulator from Android Studio first and have it ready in the list. It will have a different
name than the ones you have in your Virtual Device Manager. Example:

``Please choose a target device: » Google sdk_gphone64_x86_64 (emulator-5554)``

# Set up environment

In order to use emulators from your Android Studio some setup is required.

## Install Java

Download and install JDK 17

https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html

Then add:

``
Variable name: JAVA_HOME
``

``
Variable value: C:\Program Files\Java\jdk-17
``

To your environment variables. Confirm they work with:

``
java --version
``

``
javac --version
``

Should return v17 for both, if not make sure a newer version isn't overwriting v17. Go to _add or remove programs_ and
delete the newer version and try again to see if the correct version is used.

## Install Android

Open Android Studio, press the dropdown _More Actions_ and choose SDK Manager, then go to tab SDK Tools and install
at least 33.0.2.

Android SDK should be in your environment variables like this:

``
Variable name: ANDROID_HOME
``

``
Variable value: C:\Users\jorge\AppData\Local\Android\Sdk
``

## Install Gradle

Download version 8.5 (Binary only)

https://gradle.org/releases/

Unzip the folder somewhere, then go into environment variables and add this:

``"...\gradle-8.5\bin"``

to _system variables_ and *Path*. This is not the same as what you did with Java and Android.

# 

# 

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list