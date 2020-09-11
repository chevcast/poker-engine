# {{name}} v{{version}}

{{description}}

> {{author.name}}  
> {{author.email}}  
> {{author.url}}  

## Installation

```bash
npm install {{name}}
```

## Usage

This engine is designed around an instance of a `Table`. Simply create a new table, seat players, and deal the cards!

```js
const { Table } = require("{{name}}");

// new Table(minBuyIn = 1000, smallBlind = 5, bigBlind = 10);
const table = new Table();

// table.sitDown(id, buyIn, seatNumber?);
table.sitDown("Player 1", 1000);
table.sitDown("Player 2", 1000);
table.sitDown("Player 3", 1000);
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
const { Table } = require("@chevtek/poker-engine");

const table = new Table();

table.sitDown("Player 1", 1000);
table.sitDown("Player 2", 1000);
table.sitDown("Player 3", 1000);

table.dealCards();

// player 1 (dealer) is first to act.
// Player 2 and 3 posted blinds.
table.currentActor.callAction();

// player 2 is first to act on the flop.
table.currentActor.checkAction();

// player 3 decides to open the bet on the flop.
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

## Card

### Properties

#### `color: string`

Returns either red (`"#ff0000"`) or black (`"#000000"`);

#### `rank: string`

Returns one of: `"A"`, `"K"`, `"Q"`, `"J"`, `"T"`, `"9"`, `"8"`, `"7"`, `"6"`, `"5"`, `"4"`, `"3"`, or `"2"`.

#### `suit: string`

Returns one of: `"c"`, `"d"`, `"h"`, or `"s"` for club, diamond, heart, or spade.

#### `suitChar: string`

Returns one of the following unicode characters: `"♣"`, `"♦"`, `"♥"`, `"♠"`.

## Table

### Properties

#### `actingPlayers: Player[]`

This property will return a list of all players that are still in play and able to make decisions. (i.e. players who haven't folded and are not all-in)

#### `activePlayers: Player[]`

This property will return a list of all players who have not folded. Similar to `actingPlayers` except it does not include players who are all-in.

#### `autoMoveDealer: boolean = true`

This property determines if the dealer position should automatically increment when `dealCards` is called. By default this is `true`. However it can be useful to know who the next dealer will be _before_ calling `dealCards` to begin a new hand. In that case you can set this to false. Just keep in mind that you will have to manually call `table.moveDealer(table.dealerPosition + 1)` before calling `dealCards` or you will begin a new hand from the same dealer position as the previous hand.

#### `bigBlind: number = 10`

The amount of the big blind bet for the table. Default is `20`.

#### `bigBlindPlayer?: Player`

If there is a big blind position then this will return the player in that position. Otherwise this returns `undefined`.

#### `bigBlindPosition?: number`

If there is an active hand then this property will return the position of the big blind. Otherwise it will return `undefined`.

#### `buyIn: number = 1000`

The minimum buy-in amount for the table. Default is `1000`.

#### `communityCards: Card[]`

This is an array of any community cards on the table.

#### `currentActor?: Player`

If there is an active hand then this property will return the current player who needs to act. Otherwise this will return `undefined`.

#### `currentBet?: number`

If there is an active bet that other players must call then this property will return that value. If nobody has opened the bet yet during a betting round then this will be `undefined`.

#### `currentPosition?: number`

If there is an active hand then this property will return the position of the current actor. Otherwise it will return `undefined`.

#### `currentPot: { amount: number, eligiblePlayers: Player[] }`

This property returns the currently active pot, ignoring any side pots.

#### `currentRound?: string`

If there is an active betting round then this will return one of: `"pre-flop"`, `"flop"`, `"turn"`, `"river"`. Otherwise this will return `undefined`.

#### `dealer?: Player`

If there is at least one player at the table then the dealer position will be assigned and this property will return the player in the dealer seat. Otherwise this will return `undefined`.

#### `dealerPosition?: number`

If there is an active hand then this property will return the position of the dealer. Otherwise it will return `undefined`.

#### `handNumber: number`

This property returns a number representing the number of hands played at this table so far.

#### `lastActor?: Player`

If `lastPosition` is defined then this will return the player in that position. Otherwise this will return `undefined`.

#### `lastPosition?: number`

If there is an active hand then this property will return the position of the last person to act for the current betting round. Otherwise this will return `undefined`.

#### `lastRaise?: number`

If a player has made a raise during the current betting round then this property will return the amount of that raise. Otherwise it will return `undefined`.

#### `players: (Player|null)[]`

This will return an array of all active players currently at the table. See the `Player` properties below to see what they store.

#### `pots: { amount: number, eligiblePlayers: Player[] }[]`

This will return an array of all pots on the table. Usually there is only one, but of course side pots can form. Each pot stores the amount and the players eligible to win the pot.

#### `sidePots?: { amount: number, eligiblePlayers: Player[] }[]`

This will return an array of all pots except for the currently active pot. If there are no side pots then this returns `undefined`.

#### `smallBlind: number = 5`

The amount of the small blind bet for the table. Default is `10`.

#### `smallBlindPlayer?: Player`

If there is a small blind position then this will return the player in that position. Otherwise this returns `undefined`.

#### `smallBlindPosition?: number`

If there is an active hand then this property will return the position of the small blind. Otherwise this will return `undefined`.

#### `winners?: Player[]`

If winners have been determined then then this property will store them. Usually there is only one winner but there can be split pots, in which case this will contain all of the winners in a draw. If there are no winners then this will return `undefined`.

### Methods

#### `cleanUp(): void`

Resets the table. Good for manually clearing out the winner state after a hand if you need to render the clean table before starting the next hand.

#### `dealCards(): void`

This method begins the hand. Assigns players their hole cards and starts the first round of betting.

#### `moveDealer(seatNumber: number): void`

This method is mostly used internally but it can also be used externally to force the dealer and subsequent blinds into a new position. By default the `dealCards` method calls this when starting new hands to automatically increment the dealer position. If for some reason you want to manually increment the dealer position between hands then set `autoMoveDealer` to `false`. This can be useful if you need to know who the next dealer will be _before_ you call `dealCards` to start the next hand.

> _**Note:** This method automatically accounts for empty seats and looping back around to seat 0. So calling `table.moveDealer(table.dealerPosition + 1)` is perfectly valid even if `table.dealerPosition` is the last seat at the table or if the next seat is empty._

#### `sitDown(id: string, buyIn: number, seatNumber?: number): number`

This method allows you to seat a new player at the table. If there is an active hand then they are automatically marked as `folded: true` so that the action will skip them until a new hand is started. This method returns the seat index the player was placed at. You can optionally specify the seat index to put the player into (0 - 9). An error will throw if a player is already in the specified seat.

#### `standUp(player: Player | string): void`

This method allows you to remove a player from the table. It accepts a `Player` object or an ID string. If there is an active hand then the player is marked to leave but not actually removed. When a new hand is dealt any players marked to leave will be removed. This is so the hand logic is not interrupted when gathering bets from folded players.

## Player

### Properties

#### `bet: number = 0`

This property stores the amount of the individual player's current bet. By default this is zero until they make a bet.

#### `folded: boolean = false`

This property stores whether or not the player has folded. By default this is `false`.

#### `hand: { name: string, descr: string }`

This property returns the user's current hand. `name` is a string representing the type of hand such as `"Flush"` or `"Two Pair"`. `descr` is a string that contains the type of hand and the cards that make up that hand such as `"Two Pair, A's and Q's"`.

#### `holeCards?: [Card, Card]`

If there is an active hand this property will return a two-element array containing the player's hole cards they have been dealt. Otherwise this will return `undefined`.

#### `id: string`

A unique ID for the player. This is passed into the `table.sitDown` method when adding a player to the table and it allows you to uniquely identify the player in your own code.

#### `left: boolean = false`

This property is `true` if the player has "stood up" from the table but there is an active hand. Players marked with `left: true` will be removed from the table when the hand is over. This way they are still present while the hand they were part of plays out.

#### `raise?: number`

This property stores the amount of the player's last raise. If they have not made a raise then this property is `undefined`.

#### `showCards: boolean = false`

This property can be used to determine if the player's hole cards should be shown. This is marked `true` if the player is still in play during showdown where winners are determined.

#### `stackSize: number`

This property stores the amount of money the player has left. The initial value is passed in as the second argument when you call `table.sitDown`.

#### `table: Table`

This property is simply a convenience reference back to the table the player is part of.