# poker-engine

## Installation

```bash
npm install @chevtek/poker-engine
```

## Usage

This engine is designed around an instance of a `Table`. Simply create a new table and players and seat the players at the tabel.

```js
const { Table, Player } = require("@chevtek/poker-engine");

// new Table(minBuyIn = 1000, smallBlind = 10, bigBlind = 20);
const table = new Table();

// new Player(id, name);
const player1 = new Player(1, "Player 1");
const player2 = new Player(2, "Player 2");
const player3 = new Player(3, "Player 3");

// table.sitDown(player, buyIn);
table.sitDown(player1, 1000);
table.sitDown(player2, 1000);
table.sitDown(player3, 1000);
```

Once there are two or more players seated at the table you can begin the hand and then read from the player list to find their hole cards.

```js
table.dealCards();

// Find all player hole cards.
table.players.forEach(player => console.log(player.holeCards));
```

Begin a game loop and make players take action until the hand is over.

```js
// Loop until there are no more betting rounds.
while (table.currentRound) {

  // Find what actions are available for the current player.
  console.log(table.currentActor.legalActions());

  // Make the current player take action.
  table.currentActor.callAction();
  // table.currentActor.checkAction();
  // table.currentActor.betAction(20);
  // table.currentActor.raiseAction(40);
  // table.currentActor.foldAction();

}
```

Once all betting is done and the hand is over you can read the winners.

```js
console.log(table.winners);
```

## Example of a complete hand

```js
const { Table, Player } = require("@chevtek/poker-engine");

const table = new Table();

const player1 = new Player(1, "Player 1");
const player2 = new Player(2, "Player 2");
const player3 = new Player(3, "Player 3");

table.sitDown(player1, 1000);
table.sitDown(player2, 1000);
table.sitDown(player3, 1000);

table.dealCards();

// player 1 (dealer) is first to act.
// Player 2 and 3 posted blinds.
table.currentActor.callAction();

// player 2 is first to act on the flop.
table.currentActor.checkAction();

// player 3 decideds to open the bet on the flop.
table.currentActor.betAction(20);

// player 1 raises.
table.currentActor.raise(40);

// player 2 calls.
table.currentActor.call();

// player 3 calls player 1's raise.
table.currentActor.call();

// betting has been met, player 2 is first to act on the turn and all three decide to check.
table.currentActor.checkAction();
table.currentActor.checkAction();
table.currentActor.checkAction();

// player 2 is first to act on the river and decides
// to open the bet at $40.
table.currentActor.betAction(40);

// player 3 raises to $60.
table.currentActor.raiseAction(60);

// player 1 folds.
table.currentActor.foldAction();

// Declare winner(s)!

console.log(table.winners);

```

## Card Properties

### `color: string`

Returns either red (`"#ff0000"`) or black (`"#000000"`);

### `rank: string`

Returns one of: `"A"`, `"K"`, `"Q"`, `"J"`, `"T"`, `"9"`, `"8"`, `"7"`, `"6"`, `"5"`, `"4"`, `"3"`, or `"2"`.

### `suit: string`

Returns one of: `"c"`, `"d"`, `"h"`, or `"s"` for club, diamond, heart, or spade.

### `suitChar: string`

Returns one of the following unicode characters: `"♣"`, `"♦"`, `"♥"`, `"♠"`.

## Table Properties

### `actingPlayers: Player[]`

This property will return a list of all players that are still in play and able to make decisions. (i.e. players who haven't folded and are not all-in)

### `activePlayers: Player[]`

This property will return a list of all players who have not folded. Similar to `actingPlayers` except it does not include players who are all-in.

### `bigBlind: number = 20`

The amount of the big blind bet for the table. Default is `20`.

### `bigBlindPosition: number | undefined`

If there is an active hand then this property will return the position of the big blind. Otherwise it will return `undefined`.

### `buyIn: number = 1000`

The minimum buy-in amount for the table. Default is `1000`.

### `communityCards: Card[]`

This is an array of any community cards on the table.

### `currentActor: Player | undefined`

If there is an active hand then this property will return the current player who needs to act. Otherwise this will return `undefined`.

### `currentBet: number | undefined`

If there is an active bet that other players must call then this property will return that value. If nobody has opened the bet yet during a betting round then this will be `undefined`.

### `currentPosition: number | undefined`

If there is an active hand then this property will return the position of the current actor. Otherwise it will return `undefined`.

### `currentPot: { amount: number, eligibilePlayers: Player[] }`

This property returns the currently active pot, ignoring any side pots.

### `currentRound: string | undefined`

If there is an active betting round then this will return one of: `"pre-flop"`, `"flop"`, `"turn"`, `"river"`. Otherwise this will return `undefined`.

### `dealerPosition: number | undefined`

If there is an active hand then this property will return the position of the dealer. Othwerwise it will return `undefined`.

### `lastPosition: number | undefined`

If there is an active hand then this property will return the position of the last person to act for the current betting round. Otherwise this will return `undefined`.

### `lastRaise: number | undefined`

If a player has made a raise during the current betting round then this property will return the amount of that raise. Otherwise it will return `undefined`.

### `players: Player[]`

This will return an array of all active players currently at the table. See the `Player` properties below to see what they store.

### `pots: { amount: number, eligiblePlayers: Player[] }[]`

This will return an array of all pots on the table. Usually there is only one, but of course side pots can form. Each pot stores the amount and the players eligible to win the pot.

### `sidePots: { amount: number, eligiblePlayers: Player[] }[] | undefined`

This will return an array of all pots except for the currently active pot. If there are no side pots then this returns `undefined`.

### `smallBlindPosition: number | undefined`

If there is an active hand then this property will return the position of the small blind. Otherwise this will return `undefined`.

### `winners: Player[] | undefined`

If winners have been determined then then this property will store them. Usually there is only one winner but there can be split pots, in which case this will contain all of the winners in a draw. If there are no winners then this will return `undefined`.

## Table Methods

### `dealCards(): void`

This method begins the hand. Assigns players their hole cards and starts the first round of betting.

### `sitDown(id: string, buyIn: number): void`

This method allows you to seat a new player at the table. If there is an active hand then they are automatically marked as `folded: true` so that the action will skip them until a new hand is started.

### `standUp(player: Player | string): void`

This method allows you to remove a player from the table. It accepts a `Player` object or an ID string. If there is an active hand then the player is marked to leave but not actually removed. When a new hand is dealt any players marked to leave will be removed. This is so the hand logic is not interrupted when gathering bets from folded players.