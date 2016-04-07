
// TODO: var DeckBuilder = DeckBuilder || ...
var DeckBuilder = (function() {
    "use strict";

    var version = 1.0,
        schemaVersion = 1.0;

    function checkInstall() {
        if ( !_.has(state,'DeckBuilder') || state.DeckBuilder.version !== schemaVersion) {
            log("Installing DeckBuilder version " + version);
            state.DeckBuilder = {
                version: schemaVersion,
                decks: {}
            };
        } else {
            log("DeckBuilder version " + state.DeckBuilder.version + " already installed");
        }
    };

    function registerEventHandlers() {
        on("chat:message", handleInput);
    };

    function handleInput(message) {
        "use strict";

        var args;

        args = message.content.split(/\s+/);
        if (args[0] === "!deck") {
            switch (args[1]) {
                case 'setup':
                    _setupDeck(args, message);
                    break;
                case 'shuffle':
                    _shuffleDeck(args, message);
                    break;
                case 'draw':
                    _drawCard(args, message);
                    break;
                case 'recall':
                    var cards = _getSelectedCards(message.selected);
                    _chat("DEBUG: number of cards: " + cards.length);
                    break;
                default:
                    break;
            };
        } else if (args[0] === "!card") {
            switch (args[1]) {
                case 'return':
                    _returnCard(args, message);
                    break;
                default:
                    break;
            };
        }
    };

    function _returnCard(args, message) {
    };

    function _drawCard(args, message) {
        "use strict";
        var deck, topCard, remainingCards, builder, pile;

        // TODO: DRY this
        deck = _getSelectedDeck(message.selected);
        if (deck === undefined) {
            return undefined;
        }
        builder = state.DeckBuilder.decks[deck.id];

        topCard = builder.cards.slice(0,1)[0];
        remainingCards = builder.cards.slice(1);

        pile = getObj("graphic", builder.pile._id);

        createObj("graphic", {
            subtype: "card",
            left: pile.get("left") + pile.get("width") + pile.get("width") / 10,
            top: pile.get("top"),
            width: pile.get("width"),
            height: pile.get("height"),
            imgsrc: topCard.avatar.replace("med.jpg", "thumb.jpg"),
            pageid: Campaign().get("playerpageid"),
            layer: 'objects',
            name: 'BLAH BLAH',
            controlledby: 'all',
            playersedit_name: false,
            playersedit_bar1: false,
            playersedit_bar2: false,
            playersedit_bar3: false,
            playersedit_aura1: false,
            playersedit_aura2: false
        });
    };

    function _setupDeck(args, message) {
        "use strict";
        var index, pileCard, cards, deck;

        deck = _getSelectedDeck(message.selected);
        if (deck === undefined) {
            return undefined;
        }

        pileCard = _getSelectedCards(message.selected)[0];
        cards = findObjs({
            type: "card",
            deckid: deck.id
        });
        cards = _.reject(cards, function(card) {
            return card.id === pileCard.id
        });

        state.DeckBuilder.decks[deck.id] = {
            "deckId": deck.id,
            "pile": message.selected[0],
            "cards": cards.splice(0),
            "discarded" : [],
            "removed" : [],
            "copied": []
        };

        _chat("Deck '" + deck.get("name") + "' setup with " +
              state.DeckBuilder.decks[deck.id]["cards"].length + " cards");
    };

    function _shuffleDeck(args, message) {
        "use strict";
        var deck = _getSelectedDeck(message.selected),
            cards;
        if (deck === undefined) {
            return;
        }

        _chat("Shuffling '" + deck.get("name") + "'");

        cards = _shuffleArray(state.DeckBuilder.decks[deck.id].cards);
        state.DeckBuilder.decks[deck.id].cards = cards.slice(0);
    };

    // http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    function _shuffleArray(inputArray) {
        var array = inputArray.slice(0);
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    function _getSelectedDeck(selectedObjs) {
        "use strict";
        var decks = _getSelectedDecks(selectedObjs);

        if (decks.length === 0) {
            _chat("One deck must be selected");
            return undefined;
        } else if (decks.length > 1) {
            _chat("Only one deck may be selected.");
            return undefined;
        }

        return decks[0];
    };

    function _getSelectedDecks(selectedObjs) {
        "use strict";
        var cards,
            deck, deckId,
            decks = [], deckIds = [];

        cards = _getSelectedCards(selectedObjs);
        _.each(cards, function(card) {
            deckId = card.get("deckid");
            if (!_.contains(deckIds, deckId)) {
                deck = getObj("deck", deckId);
                deckIds.push(deckId);
                decks.push(deck);
            }
        });

        return(decks);
    }

    function _getSelectedCards(selectedObjs) {
        "use strict";
        var cards = [], cardId, card, selectedCards,
            deckCards, decks = {};

        if (selectedObjs === undefined || selectedObjs[0] === undefined) {
            return(cards);
        }

        selectedObjs = _.filter(selectedObjs, function(selectedObj) {
            return getObj("graphic", selectedObj._id) !== undefined
        });

        _.each(selectedObjs, function(selectedObj) {
            cardId = getObj("graphic", selectedObj._id).get("_cardid");
            if (cardId != undefined) {
                card = getObj("card", cardId);
                if (card !== undefined) {
                    deckCards = decks[card.get("deckid")];
                    if (deckCards === undefined) {
                        deckCards = findObjs({
                            deckid: card.get('deckid')
                        });
                        decks[card.get("deckid")] = deckCards;
                    }
                    _.each(deckCards, function(deckCard) {
                        if (card.get("id") === deckCard.get("id")) {
                            cards.push(card);
                        }
                    });
                }
            } else {
                _chat("No card selected");
            }
        });
        return(cards);
    }

    function _currentPage() {
        return getObj("page", Campaign().get("playerpageid"));
    };

    function _debug(obj) {
        _chat("DEBUG -------")
        _chat(JSON.stringify(obj, null, 4));
        _chat("-------------")
    };

    function _chat(message) {
        sendChat("DeckBuilder", "" + message);
    };

    return {
        checkInstall: checkInstall,
        registerEventHandlers: registerEventHandlers
    };
})();



on("ready", function() {
    "use strict";

    DeckBuilder.checkInstall();
    DeckBuilder.registerEventHandlers();
});
