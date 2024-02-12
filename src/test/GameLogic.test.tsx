import { describe, expect, it } from 'vitest';
import {
        checkBoardState,
        generateEmptyBoard,
        Token,
        TokenBoard,
        Player
} from '@/confourComponents/GameLogicComponent.tsx';

type Move = {
        columnIndex: number;
        player: Player;
};

function simulateMoves(board: TokenBoard, moves: Move[]): TokenBoard {
        const simBoard: TokenBoard = board.map(col => [...col]);

        moves.forEach(({columnIndex, player}) => {
                const updateRow: number = simBoard[columnIndex].findIndex((cell: Token) => cell === undefined);
                if (updateRow !== -1) {
                        simBoard[columnIndex][updateRow] = player;
                }
        });

        return simBoard;
}

describe('Game state tests', () => {
        it('should return game state inProgress', () => {
                const initialBoard = generateEmptyBoard();
                const moves: Move[] = [
                        {columnIndex: 0, player: 'red'},
                        {columnIndex: 0, player: 'green'},
                        {columnIndex: 1, player: 'red'},
                        {columnIndex: 1, player: 'green'},
                ]
                const endBoard = simulateMoves(initialBoard, moves);

                expect(checkBoardState(endBoard)).toBe('inProgress');
        });

        it('should return game state draw', () => {
                const initialBoard = generateEmptyBoard();
                const moves: Move[] = [
                        // Making draw pattern:
                        //   0  |   1  |   2  |   3  |   4  |   5  |   6
                        // g.32 | g.34 | g.36 | r.41 | g.42 | g.40 | g.38
                        // r.31 | r.33 | r.35 | g.28 | g.30 | r.39 | r.37
                        // g.18 | g.20 | g.22 | r.27 | r.29 | g.24 | g.26
                        // r.17 | r.19 | r.21 | g.16 | g.14 | r.23 | r.25
                        // g.02 | g.04 | g.06 | r.15 | r.13 | g.10 | g.12
                        // r.01 | r.03 | r.05 | g.08 | r.07 | r.09 | r.11
                        {columnIndex: 0, player: 'red'}, // 1
                        {columnIndex: 0, player: 'green'}, // 2
                        {columnIndex: 1, player: 'red'}, // 3
                        {columnIndex: 1, player: 'green'}, // 4
                        {columnIndex: 2, player: 'red'}, // 5
                        {columnIndex: 2, player: 'green'}, // 6
                        {columnIndex: 4, player: 'red'}, // 7
                        {columnIndex: 3, player: 'green'}, // 8
                        {columnIndex: 5, player: 'red'}, // 9
                        {columnIndex: 5, player: 'green'}, // 10
                        {columnIndex: 6, player: 'red'}, // 11
                        {columnIndex: 6, player: 'green'}, // 12
                        {columnIndex: 4, player: 'red'}, // 13
                        {columnIndex: 4, player: 'green'}, // 14
                        {columnIndex: 3, player: 'red'}, // 15
                        {columnIndex: 3, player: 'green'}, // 16
                        {columnIndex: 0, player: 'red'}, // 17
                        {columnIndex: 0, player: 'green'}, // 18
                        {columnIndex: 1, player: 'red'}, // 19
                        {columnIndex: 1, player: 'green'}, // 20
                        {columnIndex: 2, player: 'red'}, // 21
                        {columnIndex: 2, player: 'green'}, // 22
                        {columnIndex: 5, player: 'red'}, // 23
                        {columnIndex: 5, player: 'green'}, // 24
                        {columnIndex: 6, player: 'red'}, // 25
                        {columnIndex: 6, player: 'green'}, // 26
                        {columnIndex: 3, player: 'red'}, // 27
                        {columnIndex: 3, player: 'green'}, // 28
                        {columnIndex: 4, player: 'red'}, // 29
                        {columnIndex: 4, player: 'green'}, // 30
                        {columnIndex: 0, player: 'red'}, // 31
                        {columnIndex: 0, player: 'green'}, // 32
                        {columnIndex: 1, player: 'red'}, // 33
                        {columnIndex: 1, player: 'green'}, // 34
                        {columnIndex: 2, player: 'red'}, // 35
                        {columnIndex: 2, player: 'green'}, // 36
                        {columnIndex: 6, player: 'red'}, // 37
                        {columnIndex: 6, player: 'green'}, // 38
                        {columnIndex: 5, player: 'red'}, // 39
                        {columnIndex: 5, player: 'green'}, // 40
                        {columnIndex: 3, player: 'red'}, // 41
                        {columnIndex: 4, player: 'green'} // 42
                ]
                const endBoard = simulateMoves(initialBoard, moves);

                expect(checkBoardState(endBoard)).toBe('draw');
        });

        it('should return player red win', () => {
                const initialBoard = generateEmptyBoard();
                const moves: Move[] = [
                        {columnIndex: 0, player: 'red'},
                        {columnIndex: 0, player: 'green'},
                        {columnIndex: 1, player: 'red'},
                        {columnIndex: 1, player: 'green'},
                        {columnIndex: 2, player: 'red'},
                        {columnIndex: 2, player: 'green'},
                        {columnIndex: 3, player: 'red'}
                ]
                const endBoard = simulateMoves(initialBoard, moves);

                expect(checkBoardState(endBoard)).toBe('red');
        });

        it('should return player green win', () => {
                const initialBoard = generateEmptyBoard();
                const moves: Move[] = [
                        {columnIndex: 0, player: 'red'},
                        {columnIndex: 0, player: 'green'},
                        {columnIndex: 1, player: 'red'},
                        {columnIndex: 1, player: 'green'},
                        {columnIndex: 2, player: 'red'},
                        {columnIndex: 2, player: 'green'},
                        {columnIndex: 0, player: 'red'},
                        {columnIndex: 3, player: 'green'},
                        {columnIndex: 1, player: 'red'},
                        {columnIndex: 3, player: 'green'},
                ]
                const endBoard = simulateMoves(initialBoard, moves);

                expect(checkBoardState(endBoard)).toBe('green');
        });
});