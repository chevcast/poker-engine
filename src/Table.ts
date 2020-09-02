import { Hand } from "pokersolver";
import { Card, CardSuit, CardRank, Player } from ".";

export class Table {
  public bigBlindPosition?: number;
  public communityCards: Card[] = [];
  public currentBet?: number;
  public currentPosition?: number;
  public currentRound?: BettingRound;
  public dealerPosition?: number;
  public debug: boolean = false;
  public deck: Card[] = [];
  public handNumber: number = 0;
  public lastPosition?: number;
  public lastRaise?: number;
  public players: Player[] = [];
  public pots: Pot[] = [];
  public smallBlindPosition?: number;
  public winners?: Player[];

  constructor (
    public buyIn: number = 1000,
    public smallBlind: number = 10,
    public bigBlind: number = 20
  ) {
    if (smallBlind >= bigBlind) {
      throw new Error("The small blind must be less than the big blind.");
    }
  }

  get currentActor () {
    if (this.currentPosition === undefined) return;
    return this.players[this.currentPosition];
  }

  get actingPlayers () {
    return this.players.filter(player => !player.folded
      && player.stackSize > 0
      && (!this.currentBet || !player.raise || (this.currentBet && player.bet < this.currentBet))
    );
  }

  get activePlayers () {
    return this.players.filter(player => !player.folded);
  }

  get currentPot () {
    // If there is no pot, create one.
    if (this.pots.length === 0) {
      const newPot = new Pot();
      this.pots.push(newPot);
      return newPot;
    }
    return this.pots[this.pots.length - 1];
  }

  get dealer () {
    if (!this.dealerPosition) return;
    return this.players[this.dealerPosition];
  }

  get sidePots () {
    if (this.pots.length <= 1) {
      return;
    }
    return this.pots.slice(0, this.pots.length - 1)
  }

  moveDealer() {
    if (this.handNumber > 1) {
      this.dealerPosition!++;
    }
    if (this.dealerPosition! >= this.players.length) {
      this.dealerPosition! -= this.players.length * Math.floor(this.dealerPosition! / this.players.length);
    }
    this.smallBlindPosition = this.dealerPosition! + 1;
    if (this.smallBlindPosition >= this.players.length) {
      this.smallBlindPosition -= this.players.length * Math.floor(this.smallBlindPosition / this.players.length);
    }
    this.bigBlindPosition = this.dealerPosition! + 2;
    if (this.bigBlindPosition >= this.players.length) {
      this.bigBlindPosition -= this.players.length * Math.floor(this.bigBlindPosition / this.players.length);
    }
  }

  sitDown(id: string, buyIn: number) {
    if (this.players.length === 10) {
      throw new Error("The table is currently full.");
    }
    if (buyIn < this.buyIn) {
      throw new Error(`Your buy-in must be greater or equal to the minimum buy-in of ${this.buyIn}.`);
    }
    const existingPlayers = this.players.filter(player => player.id === id);
    if (existingPlayers.length > 0 && !this.debug) {
      throw new Error("Player already joined this table.");
    }
    const newPlayer = new Player(id, buyIn, this);
    if (this.currentRound) {
      newPlayer.folded = true;
    } else {
      this.cleanUp();
    }
    if (!this.dealerPosition) {
      this.dealerPosition = 0;
    }
    this.players.push(newPlayer);
    return this.players.length - 1;
  }

  standUp(player: Player | string): void {
    if (typeof player === "string") {
      [player] = this.players.filter(p => p.id === player);
      if (!player) {
        throw new Error(`No player found.`);
      }
    }
    if (this.currentRound) {
      player.folded = true;
      player.left = true;
      if (this.currentActor === player) {
        this.nextAction();
      }
    } else {
      const playerIndex = this.players.indexOf(player);
      this.players.splice(playerIndex, 1);
      if (playerIndex === this.dealerPosition) {
        if (this.players.length === 0) {
          delete this.dealerPosition;
        } else {
          this.moveDealer();
        }
      }
    }
  }

  cleanUp () {
    // Remove players who left;
    const leavingPlayers = this.players.filter(player => player.left);
    leavingPlayers.forEach(player => this.standUp(player));

    // Grab reference to player in dealer position.
    const dealer = this.dealer;
    // Remove busted players;
    const bustedPlayers = this.players.filter(player => player.stackSize === 0);
    bustedPlayers.forEach(player => this.standUp(player));
    if (dealer) {
      this.dealerPosition = this.players.indexOf(dealer);
    }

    // Reset player bets, hole cards, and fold status.
    this.players.forEach(player => { 
      player.bet = 0;
      delete player.raise;
      delete player.holeCards;
      player.folded = false;
      player.showCards = false;
    });

    // Clear winner if there is one.
    if (this.winners) delete this.winners;

    // Reset community cards.
    this.communityCards = [];

    // Empty pots.
    this.pots = [new Pot()];

    // Remove last raise and current bet.
    delete this.lastRaise;
    delete this.currentBet;
  }

  dealCards () {
    // Check for active round and throw if there is one.
    if (this.currentRound) {
      throw new Error("There is already an active hand!");
    }

    this.cleanUp();

    // Ensure there are at least two players.
    if (this.players.length < 2) {
      throw new Error("Not enough players to start.");
    }

    // Set round to pre-flop.
    this.currentRound = BettingRound.PRE_FLOP;

    // Increase hand number.
    this.handNumber++;

    // Move dealer and blind positions.
    this.moveDealer();

    // Force small and big blind bets and set current bet amount.
    const sbPlayer = this.players[this.smallBlindPosition!];
    const bbPlayer = this.players[this.bigBlindPosition!]
    sbPlayer.stackSize -= sbPlayer.bet = this.smallBlind;
    bbPlayer.stackSize -= bbPlayer.bet = this.bigBlind;
    this.currentBet = this.bigBlind;
    if (this.lastRaise) delete this.lastRaise;

    // Set current and last actors.
    this.currentPosition = this.dealerPosition! + 3;
    if (this.currentPosition >= this.players.length) {
      this.currentPosition -= this.players.length * Math.floor(this.currentPosition / this.players.length);
    }
    this.lastPosition = this.dealerPosition! + 2;
    if (this.lastPosition >= this.players.length) {
      this.lastPosition -= this.players.length * Math.floor(this.lastPosition / this.players.length);
    }

    // Generate newly shuffled deck.
    this.deck = this.newDeck();

    // Deal cards to players.
    this.players.forEach(player => {
      player.holeCards = [
        this.deck.pop()!,
        this.deck.pop()!
      ];
    });
  }

  nextAction () {

    // See if everyone has folded.
    if (this.activePlayers.length === 1) {
      delete this.currentRound;
      this.showdown();
      return;
    }

    // If current position is last position, move to next round.
    if (this.currentPosition === this.lastPosition) {
      this.nextRound();
      return;
    }

    // Send the action to the next player.
    this.currentPosition!++;
    if (this.currentPosition! >= this.players.length) {
      this.currentPosition! -= this.players.length;
    }

    // If the player has folded or is all-in then move the action again.
    if (this.currentActor!.folded || this.currentActor!.stackSize === 0 || (!this.currentBet && this.actingPlayers.length === 1)) {
      this.nextAction();
    }
  }

  gatherBets () {

    // Obtain all players who placed bets.
    const bettingPlayers = this.players.filter(player => player.bet > 0);

    // Check for all-in players.
    let allInPlayers = bettingPlayers.filter(player => player.bet && player.stackSize === 0);

    // Iterate over them and gather bets until there are no more all in players.
    while (allInPlayers.length > 0) {
      // Find lowest all-in player.
      const lowestAllInBet = allInPlayers.map(player => player.bet).reduce((prevBet, evalBet) => evalBet < prevBet ? evalBet : prevBet);
      // If other players have bet more than the lowest all-in player then subtract the lowest all-in amount from their bet and add it to the pot.
      bettingPlayers.forEach(player => {
        if (player.bet === 0) return;
        if (player.bet >= lowestAllInBet) {
          player.bet -= lowestAllInBet;
          this.currentPot.amount += lowestAllInBet;
          this.currentPot.eligiblePlayers.push(player);
          return;
        }
        // Gather bets from folded players and players who only called the lowest all-in.
        this.currentPot.amount += player.bet;
        this.currentPot.eligiblePlayers.push(player);
        player.bet = 0;
      });
      // Check for all-in players again.
      allInPlayers = allInPlayers.filter(player => player.bet && player.stackSize === 0);
      // Create new pot.
      this.pots.push(new Pot());
    }

    // Once we're done with all-in players add the remaining bets to the pot.
    bettingPlayers.forEach(player => {
      if (player.bet === 0) return;
      this.currentPot.amount += player.bet;
      this.currentPot.eligiblePlayers.push(player);
      player.bet = 0;
    });

    // Remove any folded players from pot eligibility.
    this.pots.forEach(pot => pot.eligiblePlayers = pot.eligiblePlayers.filter(player => !player.folded));
  }

  nextRound () {

    const resetPosition = () => {
      // Set action to first player after dealer.
      this.currentPosition = this.dealerPosition! + 1;
      if (this.currentPosition === this.players.length) {
        this.currentPosition = 0;
      }
      this.lastPosition = this.dealerPosition!;
      if (!this.actingPlayers.includes(this.currentActor!) || this.actingPlayers.length <= 1) {
        this.nextAction();
      }
    };

    switch (this.currentRound) {
      case BettingRound.PRE_FLOP:

        // Gather bets and place them in the pot.
        this.gatherBets();

        // Reset current bet and last raise.
        delete this.currentBet;
        delete this.lastRaise;

        // Set round to flop.
        this.currentRound = BettingRound.FLOP;

        // Deal the flop.
        this.communityCards.push(
          this.deck.pop()!,
          this.deck.pop()!,
          this.deck.pop()!
        );

        // Reset position;
        resetPosition();

        break;
      case BettingRound.FLOP:

        // Gather bets and place them in the pot.
        this.gatherBets();

        // Reset current bet and last raise.
        delete this.currentBet;
        delete this.lastRaise;

        // Set round to turn.
        this.currentRound = BettingRound.TURN;

        // Deal the turn.
        this.communityCards.push(this.deck.pop()!);

        // Reset position;
        resetPosition();

        break;
      case BettingRound.TURN:

        // Gather bets and place them in the pot.
        this.gatherBets();

        // Reset current bet and last raise.
        delete this.currentBet;
        delete this.lastRaise;

        // Set round to river.
        this.currentRound = BettingRound.RIVER;

        // Deal the turn.
        this.communityCards.push(this.deck.pop()!);

        // Reset position.
        resetPosition();

        break;
      case BettingRound.RIVER:
        delete this.currentRound;
        this.players.forEach(player => player.showCards = !player.folded);
        this.showdown();
        break;
    }
  }
  
  showdown () {
    if (this.currentRound) {
      throw new Error("Showdown called while there is still an active hand!");
    }
    delete this.currentPosition;
    delete this.lastPosition;

    this.gatherBets();

    // Figure out all winners for display.

    const findWinners = (players: Player[]) =>
      Hand.winners(players.map(player => {
        const hand = player.hand;
        hand.player = player;
        return hand;
      })).map((hand: any) => hand.player);

    if (this.activePlayers.length > 1) {
      this.activePlayers.forEach(player => player.showCards = true);
    }

    this.winners = findWinners(this.activePlayers);

    // Distribute pots and mark winners.
    this.pots.forEach(pot => {
      pot.winners = findWinners(pot.eligiblePlayers); 
      const award = pot.amount / pot.winners!.length;
      pot.winners!.forEach(player => player.stackSize += award);
    });
  }

  newDeck (): Card[] {
    const newDeck: Card[] = [];
    Object.keys(CardSuit).forEach(suit => {
      Object.keys(CardRank).forEach(rank => {
        newDeck.push(new Card(CardRank[rank as keyof typeof CardRank], CardSuit[suit as keyof typeof CardSuit]));
      });
    });
    for (let index = newDeck.length - 1; index > 0; index--) {
      const rndIndex = Math.floor(Math.random() * (index + 1));
      [newDeck[index], newDeck[rndIndex]] = [newDeck[rndIndex], newDeck[index]];
    }
    return newDeck;
  }
}

export class Pot {
  amount: number = 0;
  eligiblePlayers: Player[] = new Array();
  winners?: Player[];
}

export enum BettingRound {
  PRE_FLOP = "pre-flop",
  FLOP = "flop",
  TURN = "turn",
  RIVER = "river"
}