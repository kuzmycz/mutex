type MutexRelease = () => void;

function log(method: string, message: string) {
    console.debug(`Semaphore::${method} ${message}`);
}

/**
 * A Mutex control access to a critical resource by allowing only one thread to access
 * the resource a time. When the thread id finished with the resource it releases control
 * of the semaphore and the next waiter is given control.
 *
 */
export class Mutex {
    private lock: boolean = false;
    private queue: { (release: MutexRelease): void }[] = [];
    debug: boolean;

    constructor(options?: {debug: boolean}) {
        this.debug = options?.debug ?? false;
    }

    /**
     * True if the semaphore is locked and there is a running task.
     *
     * @return true if locked.
     */
    get locked() {
        return this.lock;
    }

    /**
     * The number of waiters for the semaphore
     *
     * @return The number of waiters
     */
    get waiters() {
        return this.queue.length;
    }

    /**
     * Acquire access to the critical resource. If this semaphore is locked
     * go onto a queue of waiters and wait. When it is the caller's time to
     * execute, the promise will resolve to the release function and the
     * caller is free to run its code
     *
     * @return  A promise to a release function
     *
     * @see #release
     */
    acquire(): Promise<MutexRelease> {
        if (this.lock) {
            if (this.debug) log("acquire", "Locked!");

            // Place the waiter in the queue. When its the callers time to shine
            // the returned promise will have the release function

            return new Promise<() => void>((resolve, reject) => {
                this.queue.push((release: {():void}) => resolve(release) )
            })

        } else {
            // The semaphore is currently unlocked. Let's lock this semaphore and
            // return control to the caller.

            if (this.debug) log("acquire", "Unlocked");
            this.lock = true;
            if (this.debug) log("acquire", "Now Locked...");
            return Promise.resolve(this.release);
        }
    }

    /**
     * Releases the semaphore to the next waiter or unlocks the semaphore.
     * <p>
     * When control is released to a waiter, the waiter is given this
     * function (release) to release control to the next waiter.  And life goes on...
     * <p/>
     * <b>Note</b>: This function is private and can only be accessed if given by acquire.
     * <p>
     * <b>Important</b>: this function must be executed by the woken task. If it doesn't then
     * the application will wait 'FOREVER'.
     *
     * @return void
     *
     * @see #acquire
     */
    private release = (): void => {
        if (this.debug) log("release", "Releasing semaphore")
        // Are there any waiters?
        if (this.queue.length > 0) {
            if (this.debug) log("release", `We have ${this.queue.length} waiter(s).`)
            // yes, grab the first one off the queue and wake it up and give it the release function
            const resolve = this.queue.shift()!;

            // Wake the waiter and give it a handle to the release function
            resolve(this.release);
        } else {
            // No more waiters. Unlock this semaphore
            if (this.debug) log("release", "Unlock semaphore")
            this.lock = false;
        }
    };
}
