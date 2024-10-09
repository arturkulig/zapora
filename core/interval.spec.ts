import { describe, it } from "@jest/globals";
import { delay } from "./delay";
import { timeout } from "./internal/timeout";
import { interval } from "./interval";
import { expectStream } from "./tests/expectStream";

describe("interval", () => {
  it("emits consecutive numbers", async () => {
    const periodMs = 2050;
    await expectStream(
      interval(100),
      [
        0, //  100
        1, //  200
        2, //  300
        3, //  400
        4, //  500
        5, //  600
        6, //  700
        7, //  800
        8, //  900
        9, //  1000
        10, // 1100
        11, // 1200
        12, // 1300
        13, // 1400
        14, // 1500
        15, // 1600
        16, // 1700
        17, // 1800
        18, // 1900
        19, // 2000
      ],
      false,
      timeout(periodMs),
    );
  });

  it("emits only when observer is ready", async () => {
    const periodMs = 2050;
    await expectStream(
      interval(100).pipe((_) => delay(_, 111)),
      [
        0, //  100
        // 1,  200 not ready!
        2, //  300
        // 3,  400 not ready!
        4, //  500
        // 5,  600 not ready!
        6, //  700
        // 7,  800 not ready!
        8, //  900
        // 9,  1000 not ready!
        10, // 1100
        // 11, 1200 not ready!
        12, // 1300
        // 13, 1400 not ready!
        14, // 1500
        // 15, 1600 not ready!
        16, // 1700
        // 17, 1800 not ready!
        18, // 1900
        // 19, 2000 not ready!
      ],
      false,
      timeout(periodMs),
    );
  });
});
