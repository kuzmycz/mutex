# Semaphore

## Overview
Semaphore is a package implemented to control access to a shared resources or code executed by multiple threads.

The purpose of a semaphore is to synchronize access to critical sections of your code. This is achieved by blocking access to other threads until the thread currently interacting with the resource has finished. Once completed, control is released, and the next waiter gains access to the resource.

Though JavaScript is technically single-threaded, it supports asynchronous activities, hence the need to prevent race conditions where two different paths of execution vie for the same resource.

A common use-case surfaces in React.js when multiple components depend on configuration information from a server (e.g., feature flags). Without some form of synchronization, multiple components can generate identical server requests simultaneously, creating unnecessary server load. By utilizing a semaphore, you can prevent subsequent access to the call to the server until the response returns. Any waiting components (those blocked) can then utilize the locally cached configuration, thus eliminating superfluous server traffic.


## Installation
Install via npm:
```shell
    npm install @kuzmycz/semaphore
```

## Importing

**CommonJS:**
```javascript
const {Semaphore} = require('@kuzmycz/semaphore');
```

**ES6:**
```javascript
import {Semaphore} from '@kuzmycz/semaphore';
```

**TypeScript:**
```typescript
import { Semaphore } from 'async-mutex';
```

## API
###Create a new semaphore:
```typescript
const semaphore = new Semaphore();
```

### Secure a code section with Semaphore:

```typescript
const release = await semaphore.acquire();
try {
    // ... code to execute
} finally {
    release();
}
```

*** Promise style ***
```typescript
semaphore.acquire().then((release) => {
    try {
        //... code to execute
    } finally {
        release();
    }
});
```

***IMPORTANT***: Always ensure that the release() function is called. Failure to do so will result in all current and future waiters waiting indefinitely.


## Design philosophy
Semaphore is designed to be user-friendly, weightless, with superior performance and dependency-free.
