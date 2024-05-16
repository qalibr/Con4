# Project

This is a connect four game web app using React (Vite) and Capacitor for porting to native platforms.

## TL;DR

Command line commands for development:

### Web development with live reload. 

``npm run dev``

``npm run test``

### Prettier

``npm run lint``

``npm run lint -- --fix``

### Port to Android

_Requires setup, see below_

``npm run build``

``npx cap copy``

``npx cap sync``

``npx cap run android``

### Git -- Updating feature branches with latest changes from main.

1. ``git checkout main`` Change to main branch
2. ``git fetch origin main`` Fetch changes on remote repo
3. ``git pull origin main`` Pull changes from remote repo
4. ``git checkout some-feature`` Change to feature branch
5. ``git merge main`` Merge changes from main into feature branch.
6. Resolve potential conflicts.
7. ``git add .`` Stage all changes.
8. ``git commit -m "merged main"`` Commit and append message.
9. ``git push origin some-feature`` Push to remote repo.

## Tools

- NodeJS
    - Due to an annoying
      error (https://stackoverflow.com/questions/68774489/punycode-is-deprecated-in-npm-what-should-i-replace-it-with)
      We are using Node LTS 20.11 for this project.
        - Uninstall NodeJS before installing nvm.
        - https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows
        - https://github.com/coreybutler/nvm-windows#installation--upgrades
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
    - ~~Web development and testing in a sanitized environment.~~ Vite broke it, worked well with CRA.
    - Local testing.
- React
    - Template made using Vite
    - For easy frontend development.
    - Using typescript template.
- shadcn/ui, Tailwind CSS, Headless UI and Heroicons
    - Developing the User Interface using shadcn/ui
        - An extremely easy to use and beautiful component library.
        - Used for light/dark mode theme switch, used for buttons and menus.
    - Also using Headless UI, Heroicons, and [Simple Icons](https://github.com/simple-icons/simple-icons) which are libraries made by the Tailwind CSS team to complement the main
      library.
    - Using Animate.style for css animations on the Coins.
- Capacitor
    - Porting web app to native platforms.
- Supabase
    - BaaS (backend-as-service) for authentication and database.
- Prettier, ESLint
    - Using Prettier and ESLint for code style consistency.

# Development Commands

You will be running the app from the command line.

## Web dev:

Run ``npm run dev``

### ~~Development through Docker~~ **(Don't use)**

**This does not work reliably with Vite, as opposed to CRA.**

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

## Testing

Run ``npm run test`` to run your test suite and exit.

Run ``npm run coverage`` to run your tests and then wait for file changes. Upon file change test suite automatically
re-runs.

### Docker Testing

We can also use Docker to run tests ``docker-compose up``

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

test
