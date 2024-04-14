import { Player_ } from "@/confourComponents/game/pixi/util/player.tsx";
import { PixiBoard } from "@/confourComponents/game/pixi/components/board/pixi-board.tsx";

export enum CoinSlot {
  Empty,
  Red,
  Green,
}

export class CoinsTracker {
  private readonly boardXY: [number, number];

  private allSlots: CoinSlot[][] = [];
  private winner?: Player_ = undefined;
  private winnerCoinPositions: Array<[number, number]> = [];

  constructor(boardDimensions: [number, number]) {
    if (boardDimensions[0] < 0 || boardDimensions[1] < 0)
      throw new Error("Board dimensions cannot be negative numbers.");

    this.boardXY = boardDimensions;
    this.initializeSlots();
  }

  // This method initializes the slots in each column.
  private initializeSlots(): void {
    this.allSlots = [];

    for (
      let columnIndex = 0;
      columnIndex < PixiBoard.BOARD_X_Y[1]; // Less than 7, defined in 'pixi-board.tsx'
      columnIndex++
    ) {
      const wholeColumn = []; // Column to push Empty slots to

      for (
        let rowIndex = 0;
        rowIndex < PixiBoard.BOARD_X_Y[0]; // Less than 6, defined in 'pixi-board.tsx'
        rowIndex++
      ) {
        wholeColumn.push(CoinSlot.Empty);
      }

      this.allSlots.push(wholeColumn);
    }
  }

  public reset(): void {
    this.initializeSlots();
    this.winner = undefined;
    this.winnerCoinPositions = [];
  }

  public isEmptySlotAvailable(columnIndex: number): boolean {
    return this.allSlots[columnIndex].some(
      (slot: CoinSlot) => slot == CoinSlot.Empty,
    );
  }

  // @ts-expect-error Erroneous error indicating we are not returning something.
  public addCoin(player: Player_, columnIndex: number): [number, number] {
    if (!this.isEmptySlotAvailable(columnIndex))
      throw new Error("Column: `" + columnIndex + "` is full.");

    if (this.isWin() || this.isTie())
      throw new Error("The game has ended, cannot make move.");

    for (let rowIndex = 0; rowIndex < this.boardXY[0]; rowIndex++) {
      if (this.allSlots[columnIndex][rowIndex] == CoinSlot.Empty) {
        const coinPosition: [number, number] = [columnIndex, rowIndex];
        this.allSlots[columnIndex][rowIndex] = this.playerToCoinSlot(player);
        this.checkIsWinningMove(coinPosition);

        return coinPosition;
      }
    }
  }

  public isWin(): boolean {
    return this.winner != null;
  }

  public isTie(): boolean {
    const thereIsAtLeastOneEmptySlot = this.allSlots.some(
      (column: CoinSlot[]) =>
        column.some((slot: CoinSlot) => slot == CoinSlot.Empty),
    );

    return !thereIsAtLeastOneEmptySlot;
  }

  public getWinner(): Player_ | undefined {
    return this.winner;
  }

  public isGameOver(): boolean {
    return this.isWin() || this.isTie();
  }

  public getWinningCoinPositions(): Array<[number, number]> {
    return this.winnerCoinPositions;
  }

  private playerToCoinSlot(player: Player_): CoinSlot {
    if (player == Player_.Green) return CoinSlot.Green;
    return CoinSlot.Red;
  }

  private coinToPlayerSlot(coin: CoinSlot): Player_ {
    if (coin == CoinSlot.Green) return Player_.Green;
    return Player_.Red;
  }

  private checkIsWinningMove(boardXYCoinPosition: [number, number]): void {
    const activeCoinType: CoinSlot =
      this.allSlots[boardXYCoinPosition[0]][boardXYCoinPosition[1]];

    const adjacentCoinsTopRight: Array<[number, number]> = [];
    for (
      let columnIndex = boardXYCoinPosition[0] + 1,
        rowIndex = boardXYCoinPosition[1] + 1;
      columnIndex < boardXYCoinPosition[0] + 4 &&
      columnIndex < this.boardXY[1] &&
      rowIndex < boardXYCoinPosition[1] + 4 &&
      rowIndex < this.boardXY[0];
      columnIndex++, rowIndex++
    ) {
      if (this.allSlots[columnIndex][rowIndex] === activeCoinType)
        adjacentCoinsTopRight.push([columnIndex, rowIndex]);
      else break;
    }

    const adjacentCoinsRight: Array<[number, number]> = [];
    for (
      let columnIndex = boardXYCoinPosition[0] + 1;
      columnIndex < boardXYCoinPosition[0] + 4 && columnIndex < this.boardXY[1];
      columnIndex++
    ) {
      if (this.allSlots[columnIndex][boardXYCoinPosition[1]] === activeCoinType)
        adjacentCoinsRight.push([columnIndex, boardXYCoinPosition[1]]);
      else break;
    }

    const adjacentCoinsBottomRight: Array<[number, number]> = [];
    for (
      let columnIndex = boardXYCoinPosition[0] + 1,
        rowIndex = boardXYCoinPosition[1] - 1;
      columnIndex < boardXYCoinPosition[0] + 4 &&
      columnIndex < this.boardXY[1] &&
      rowIndex > boardXYCoinPosition[1] - 4 &&
      rowIndex >= 0;
      columnIndex++, rowIndex--
    ) {
      if (this.allSlots[columnIndex][rowIndex] === activeCoinType)
        adjacentCoinsBottomRight.push([columnIndex, rowIndex]);
      else break;
    }

    const adjacentCoinsBottom: Array<[number, number]> = [];
    for (
      let rowIndex = boardXYCoinPosition[1] - 1;
      rowIndex > boardXYCoinPosition[1] - 4 && rowIndex >= 0;
      rowIndex--
    ) {
      if (this.allSlots[boardXYCoinPosition[0]][rowIndex] === activeCoinType)
        adjacentCoinsBottom.push([boardXYCoinPosition[0], rowIndex]);
      else break;
    }

    const adjacentCoinsBottomLeft: Array<[number, number]> = [];
    for (
      let columnIndex = boardXYCoinPosition[0] - 1,
        rowIndex = boardXYCoinPosition[1] - 1;
      columnIndex > boardXYCoinPosition[0] - 4 &&
      columnIndex >= 0 &&
      rowIndex > boardXYCoinPosition[1] - 4 &&
      rowIndex >= 0;
      columnIndex--, rowIndex--
    ) {
      if (this.allSlots[columnIndex][rowIndex] === activeCoinType)
        adjacentCoinsBottomLeft.push([columnIndex, rowIndex]);
      else break;
    }

    const adjacentCoinsLeft: Array<[number, number]> = [];
    for (
      let columnIndex = boardXYCoinPosition[0] - 1;
      columnIndex > boardXYCoinPosition[0] - 4 && columnIndex >= 0;
      columnIndex--
    ) {
      if (this.allSlots[columnIndex][boardXYCoinPosition[1]] === activeCoinType)
        adjacentCoinsLeft.push([columnIndex, boardXYCoinPosition[1]]);
      else break;
    }

    const adjacentCoinsTopLeft: Array<[number, number]> = [];
    for (
      let columnIndex = boardXYCoinPosition[0] - 1,
        rowIndex = boardXYCoinPosition[1] + 1;
      columnIndex > boardXYCoinPosition[0] - 4 &&
      columnIndex >= 0 &&
      rowIndex < boardXYCoinPosition[1] + 4 &&
      rowIndex < this.boardXY[0];
      columnIndex--, rowIndex++
    ) {
      if (this.allSlots[columnIndex][rowIndex] === activeCoinType)
        adjacentCoinsTopLeft.push([columnIndex, rowIndex]);
      else break;
    }

    let isWin: boolean = false;
    const winnerCoins: Array<[number, number]> = [];

    if (adjacentCoinsBottom.length >= 3) {
      adjacentCoinsBottom.forEach((coinPosition: [number, number]) =>
        winnerCoins.push(coinPosition),
      );
      isWin = true;
    }

    if (adjacentCoinsTopRight.length + adjacentCoinsBottomLeft.length >= 3) {
      adjacentCoinsTopRight.forEach((coinPosition: [number, number]) =>
        winnerCoins.push(coinPosition),
      );
      adjacentCoinsBottomLeft.forEach((coinPosition: [number, number]) =>
        winnerCoins.push(coinPosition),
      );
      isWin = true;
    }

    if (adjacentCoinsRight.length + adjacentCoinsLeft.length >= 3) {
      adjacentCoinsRight.forEach((coinPosition: [number, number]) =>
        winnerCoins.push(coinPosition),
      );
      adjacentCoinsLeft.forEach((coinPosition: [number, number]) =>
        winnerCoins.push(coinPosition),
      );
      isWin = true;
    }

    if (adjacentCoinsBottomRight.length + adjacentCoinsTopLeft.length >= 3) {
      adjacentCoinsBottomRight.forEach((coinPosition: [number, number]) =>
        winnerCoins.push(coinPosition),
      );
      adjacentCoinsTopLeft.forEach((coinPosition: [number, number]) =>
        winnerCoins.push(coinPosition),
      );
      isWin = true;
    }

    if (isWin) {
      winnerCoins.push(boardXYCoinPosition);
      this.winnerCoinPositions = winnerCoins;
      this.winner = this.coinToPlayerSlot(activeCoinType);
    }
  }
}
