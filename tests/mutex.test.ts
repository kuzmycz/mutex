import {Mutex} from "../src";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let tasks: number[] = [];

beforeEach(() => {
    tasks = [];
});

const task = async (mutex: Mutex, taskNumber: number, delay: number) => {
    const release = await mutex.acquire();
    await sleep(delay);
    tasks.push(taskNumber);
    release();
}

const task2 = async (taskNumber: number, delay: number) => {
    await sleep(delay);
    tasks.push(taskNumber);
}

it('async tasks complete out of sequence', async () => {
    let t1 = task2( 1, 1000);
    let t2 = task2( 2, 200);
    let t3 = task2( 3, 100);
    let t4 = task2( 4, 700);
    let t5 = task2( 5, 300);

    await Promise.all([t1,t2,t3,t4,t5]);

    expect(tasks).toEqual([3,2,5,4,1]);

});

it('Verifies that tasks will complete in sequence', async () => {
    const mutex = new Mutex();
    let t1 = task(mutex,  1, 1000);
    let t2 = task(mutex,  2, 200);
    let t3 = task(mutex,  3, 100);
    let t4 = task(mutex,  4, 700);
    let t5 = task(mutex,  5, 300);

    expect(mutex.waiters).toBe(4);
    expect(mutex.locked).toBe(true);

    await Promise.all([t1, t2,t3,t4,t5]);

    expect(tasks).toEqual([1,2,3,4,5]);
    expect(mutex.waiters).toBe(0);
    expect(mutex.locked).toBe(false);

});

test('Mutex is initially unlocked', async () => {
    const semaphore = new Mutex();

    expect(semaphore.locked).toBe(false);
});

test('Mutex is locked when processing a task', async () => {
    const mutex = new Mutex();
    const t1 = task(mutex, 1, 1000);

    expect(mutex.locked).toBe(true);
    expect(mutex.waiters).toBe(0);

    await t1;
    // After completed should be unlocked
    expect(mutex.locked).toBe(false);
});


test("Verifies that semaphore is still functioning after a set of tasks have completed", async () =>{
    const mutex = new Mutex();
    let t1 = task(mutex,  1, 1000);
    let t2 = task(mutex,  2, 200);
    let t3 = task(mutex,  3, 100);
    let t4 = task(mutex,  4, 700);
    let t5 = task(mutex,  5, 300);

    expect(mutex.waiters).toBe(4);
    expect(mutex.locked).toBe(true);

    await Promise.all([t1, t2,t3,t4,t5]);
    expect(tasks).toEqual([1,2,3,4,5]);

    let t6 = task(mutex,  6, 1000);
    let t7 = task(mutex,  7, 200);
    let t8 = task(mutex,  8, 100);
    let t9 = task(mutex,  9, 700);
    let t10 = task(mutex,  10, 300);

    expect(mutex.waiters).toBe(4);
    expect(mutex.locked).toBe(true);

    await Promise.all([t6, t7,t8,t9,t10]);
    expect(tasks).toEqual([1,2,3,4,5,6,7,8,9,10]);
});

it("Tests that 2 different semaphores are unrelated.", async () =>{
    const mutex = new Mutex();
    const mutex1 = new Mutex();
    let t1 = task(mutex,  1, 1000);
    let t2 = task(mutex,  2, 200);
    let t3 = task(mutex,  3, 100);
    let t4 = task(mutex,  4, 700);
    let t5 = task(mutex,  5, 300);
    let t6 = task(mutex1,  6, 1000);
    let t7 = task(mutex1,  7, 200);
    let t8 = task(mutex1,  8, 100);
    let t9 = task(mutex1,  9, 700);
    let t10 = task(mutex1,  10, 300);

    expect(mutex.waiters).toBe(4);
    expect(mutex.locked).toBe(true);
    expect(mutex1.waiters).toBe(4);
    expect(mutex1.locked).toBe(true);

    await Promise.all([t1, t2,t3,t4,t5, t6,t7,t8,t9,t10]);
    expect(tasks).toEqual([1,6,2,7,3,8,4,9,5,10]);

    expect(mutex.locked).toEqual(false);
    expect(mutex1.locked).toEqual(false);

})