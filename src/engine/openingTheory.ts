import { Chess } from 'chess.js'
import openingsData from '../data/openings.json'

const openingsDict = openingsData as Record<string, { eco: string; name: string }>

export interface TheoryMoveResult {
  isBook: boolean
  openingName?: string
  eco?: string
  purpose?: string
  deviation?: TheoryDeviation
}

export interface TheoryDeviation {
  openingName: string
  eco: string
  bookMoves: string[]
  bookMovePurposes: Record<string, string>
  recommendedMove: string
  recommendedPurpose: string
}

interface TheoryRawLine {
  opening: string
  eco: string
  moves: Array<{
    san: string
    purpose: string
  }>
}

/**
 * Curated repository of opening theory lines for mainstream chess systems.
 * Each move contains the strategic rationale within that opening.
 */
const THEORY_LINES: TheoryRawLine[] = [
  // ==========================================
  // 1. LONDON SYSTEM
  // ==========================================
  {
    opening: 'London System',
    eco: 'D02',
    moves: [
      { san: 'd4', purpose: 'Seizes central space and establishes control over e5 and c5.' },
      { san: 'd5', purpose: 'Establishes a solid central pawn anchor, preventing White from playing an uncontested e4.' },
      { san: 'Nf3', purpose: 'Controls e5 and d4 with harmonic knight development before committing the bishop.' },
      { san: 'Nf6', purpose: 'Controls e4 and d5, developing the knight toward the center.' },
      { san: 'Bf4', purpose: 'The London keystone: activates the dark-squared bishop outside the pawn chain before playing e3.' },
      { san: 'e6', purpose: 'Solidifies the d5 pawn and prepares development for the dark-squared bishop.' },
      { san: 'e3', purpose: 'Solidifies d4, opens the f1-a6 diagonal for the bishop, and cements the f4 bishop outside the pawn chain.' },
      { san: 'c5', purpose: 'The primary central challenge: strikes immediately at White\'s d4 stronghold.' },
      { san: 'c3', purpose: 'Cements the d4 pawn pyramid, blunts Black\'s queenside play, and creates a retreat square on c2 for the bishop.' },
      { san: 'Nc6', purpose: 'Increases pressure on White\'s d4 pawn anchor and contests central squares.' },
      { san: 'Nbd2', purpose: 'Develops the knight harmoniously without obstructing the c-pawn, supporting e4 and controlling c4.' },
      { san: 'Bd6', purpose: 'Challenges White\'s influential f4 bishop along the crucial b8-h2 diagonal.' },
      { san: 'Bg3', purpose: 'Safeguards the bishop; if Black captures with ...Bxg3, hxg3 opens the semi-open h-file for White\'s rook.' },
      { san: 'O-O', purpose: 'Tucks the king into safety and activates the kingside rook.' },
      { san: 'Bd3', purpose: 'Posts the bishop on an aggressive diagonal pointing directly toward Black\'s castled king.' },
      { san: 'b6', purpose: 'Prepares to fianchetto the light-squared bishop to b7 to control the long diagonal.' },
      { san: 'O-O', purpose: 'Secures king safety and connects White\'s rooks along the first rank.' },
      { san: 'Bb7', purpose: 'Develops the bishop onto the long a8-h1 diagonal, eyeing the e4 outpost.' },
      { san: 'Ne5', purpose: 'Plants a dominant knight on the e5 outpost, the strategic offensive peak of the London System.' }
    ]
  },
  {
    opening: 'London System (Early 2.Bf4)',
    eco: 'D00',
    moves: [
      { san: 'd4', purpose: 'Seizes central space and establishes control over e5 and c5.' },
      { san: 'd5', purpose: 'Establishes a solid central pawn anchor, preventing White from playing an uncontested e4.' },
      { san: 'Bf4', purpose: 'Accelerated London: develops the bishop to f4 immediately to deter Black from early ...c5 or ...e5 ideas.' },
      { san: 'Nf6', purpose: 'Controls central squares and develops kingside minor pieces.' },
      { san: 'e3', purpose: 'Fortifies d4 and opens diagonals for the kingside bishop and queen.' },
      { san: 'c5', purpose: 'Challenges White\'s central pawn foundation.' },
      { san: 'c3', purpose: 'Builds the resilient London pawn triangle (c3-d4-e3) guarding the center.' },
      { san: 'Nc6', purpose: 'Puts direct tactical pressure against White\'s d4 pawn.' },
      { san: 'Nf3', purpose: 'Controls e5 and develops kingside pieces toward castling.' },
      { san: 'e6', purpose: 'Supports d5 solidly and prepares kingside development.' },
      { san: 'Nbd2', purpose: 'Reinforces the center without blocking the c-pawn.' },
      { san: 'Bd6', purpose: 'Contests White\'s bishop on the key b8-h2 diagonal.' },
      { san: 'Bg3', purpose: 'Maintains the bishop pair potential and keeps the h-file option alive.' },
      { san: 'O-O', purpose: 'Secures kingside safety.' },
      { san: 'Bd3', purpose: 'Develops the bishop along the attacking b1-h7 diagonal.' }
    ]
  },
  {
    opening: 'London System (vs Early c5 / Qb6)',
    eco: 'D02',
    moves: [
      { san: 'd4', purpose: 'Seizes central space.' },
      { san: 'd5', purpose: 'Establishes central anchor.' },
      { san: 'Bf4', purpose: 'Develops the bishop actively outside the pawn chain.' },
      { san: 'c5', purpose: 'Early strike challenging White\'s d4 pawn.' },
      { san: 'e3', purpose: 'Defends d4 solidly and opens lines for kingside development.' },
      { san: 'Nc6', purpose: 'Adds pressure against the central d4 point.' },
      { san: 'c3', purpose: 'Maintains the granite pawn pyramid supporting d4.' },
      { san: 'Nf6', purpose: 'Develops the knight and controls e4.' },
      { san: 'Nf3', purpose: 'Develops kingside knight and controls the e5 outpost.' },
      { san: 'Qb6', purpose: 'Attacks the b2 pawn left unguarded by the f4 bishop.' },
      { san: 'Qb3', purpose: 'Offers a queen exchange on b3, protecting b2 and neutralizing Black\'s pressure.' },
      { san: 'c4', purpose: 'Locks the queenside and drives White\'s queen away.' },
      { san: 'Qc2', purpose: 'Retreats the queen safely while keeping pressure along the c-file.' },
      { san: 'Bf5', purpose: 'Challenges White\'s queen with tempo.' },
      { san: 'Qc1', purpose: 'Maintains queen safety and retains piece harmony.' }
    ]
  },
  {
    opening: 'London System (vs King\'s Indian Setup)',
    eco: 'A48',
    moves: [
      { san: 'd4', purpose: 'Takes central space.' },
      { san: 'Nf6', purpose: 'Flexible Indian defense setup.' },
      { san: 'Bf4', purpose: 'Develops the bishop outside the pawn chain against Indian setups.' },
      { san: 'g6', purpose: 'Prepares kingside fianchetto to contest the long diagonal.' },
      { san: 'e3', purpose: 'Solidifies d4 and prepares kingside development.' },
      { san: 'Bg7', purpose: 'Posts the bishop on the potent long diagonal.' },
      { san: 'Nf3', purpose: 'Develops kingside knight, preparing castling.' },
      { san: 'O-O', purpose: 'Secures kingside safety.' },
      { san: 'Be2', purpose: 'Quiet, solid bishop development keeping kingside safe.' },
      { san: 'd6', purpose: 'Supports e5 central strike.' },
      { san: 'h3', purpose: 'Carves out a refuge square on h2 for the bishop against ...Nh5.' },
      { san: 'c5', purpose: 'Strikes at the central d4 pawn.' },
      { san: 'c3', purpose: 'Solidifies the d4 anchor against Black\'s pawn break.' }
    ]
  },
  {
    opening: 'Jobava London System',
    eco: 'D00',
    moves: [
      { san: 'd4', purpose: 'Seizes central space.' },
      { san: 'd5', purpose: 'Central anchor.' },
      { san: 'Nc3', purpose: 'Jobava setup: develops the knight aggressively to prepare e4 or Nb5.' },
      { san: 'Nf6', purpose: 'Controls e4 and develops kingside.' },
      { san: 'Bf4', purpose: 'Jobava bishop activation targeting the c7 weakness and controlling e5.' },
      { san: 'a6', purpose: 'Prevents White\'s knight from jumping to b5 to threaten c7.' },
      { san: 'e3', purpose: 'Solidifies d4 and frees the light-squared bishop.' },
      { san: 'Bf5', purpose: 'Develops the light-squared bishop actively outside the pawn chain.' },
      { san: 'f3', purpose: 'Prepares the aggressive central push with e2-e4 and kingside g4 expansion.' }
    ]
  },

  // ==========================================
  // 2. ITALIAN GAME & GIUOCO PIANO
  // ==========================================
  {
    opening: 'Italian Game (Giuoco Pianissimo)',
    eco: 'C50',
    moves: [
      { san: 'e4', purpose: 'Controls central squares d5 and f5, freeing queen and bishop.' },
      { san: 'e5', purpose: 'Establishes equal central presence, stopping d4.' },
      { san: 'Nf3', purpose: 'Attacks Black\'s e5 pawn with rapid development.' },
      { san: 'Nc6', purpose: 'Defends the e5 pawn and controls d4.' },
      { san: 'Bc4', purpose: 'Targets Black\'s vulnerable f7 square, the weakest point in Black\'s camp.' },
      { san: 'Bc5', purpose: 'Classical Italian response: mirrors White\'s bishop, eyeing f2.' },
      { san: 'c3', purpose: 'Prepares to build a full classical pawn center with d2-d4.' },
      { san: 'Nf6', purpose: 'Develops kingside knight and attacks White\'s e4 pawn.' },
      { san: 'd3', purpose: 'Giuoco Pianissimo: solidifies e4 and creates a durable, maneuverable center.' },
      { san: 'd6', purpose: 'Solidifies e5 and frees the c8 bishop.' },
      { san: 'O-O', purpose: 'Secures kingside safety.' },
      { san: 'a6', purpose: 'Creates an escape square on a7 for the dark-squared bishop.' },
      { san: 'Bb3', purpose: 'Tucks the bishop away safely from prospective ...Na5 trades.' },
      { san: 'Ba7', purpose: 'Preserves the active diagonal pressure.' },
      { san: 'Nbd2', purpose: 'Maneuvers the knight toward f1 and g3 to assist kingside attacking plans.' },
      { san: 'O-O', purpose: 'Completes kingside castling.' },
      { san: 'h3', purpose: 'Prevents Black from pinning with ...Bg4.' }
    ]
  },
  {
    opening: 'Italian Game (Classical Center 4.c3 & d4)',
    eco: 'C53',
    moves: [
      { san: 'e4', purpose: 'Seizes the center.' },
      { san: 'e5', purpose: 'Fights for central equality.' },
      { san: 'Nf3', purpose: 'Attacks e5.' },
      { san: 'Nc6', purpose: 'Defends e5.' },
      { san: 'Bc4', purpose: 'Italian bishop targeting f7.' },
      { san: 'Bc5', purpose: 'Active bishop development.' },
      { san: 'c3', purpose: 'Prepares immediate d4 pawn push.' },
      { san: 'Nf6', purpose: 'Attacks e4.' },
      { san: 'd4', purpose: 'Explodes open the center and challenges Black\'s bishop.' },
      { san: 'exd4', purpose: 'Liquidates central pawn.' },
      { san: 'cxd4', purpose: 'Recaptures toward the center, forming a broad pawn duo.' },
      { san: 'Bb4+', purpose: 'Checks White\'s king to gain time for central counterplay.' },
      { san: 'Bd2', purpose: 'Interposes to neutralize the check.' },
      { san: 'Bxd2+', purpose: 'Exchanges bishops to reduce central pressure.' },
      { san: 'Nbxd2', purpose: 'Recaptures harmoniously with knight.' },
      { san: 'd5', purpose: 'The vital central counter-strike shattering White\'s pawn center.' }
    ]
  },
  {
    opening: 'Two Knights Defense',
    eco: 'C55',
    moves: [
      { san: 'e4', purpose: 'Central pawn push.' },
      { san: 'e5', purpose: 'Central symmetry.' },
      { san: 'Nf3', purpose: 'Attacks e5.' },
      { san: 'Nc6', purpose: 'Defends e5.' },
      { san: 'Bc4', purpose: 'Aims at f7.' },
      { san: 'Nf6', purpose: 'Two Knights: counterattacks White\'s e4 pawn instead of quiet bishop moves.' },
      { san: 'd3', purpose: 'Solidifies e4 and enters the quiet, strategic Modern Two Knights.' },
      { san: 'Bc5', purpose: 'Transposes into active Giuoco Pianissimo play.' },
      { san: 'c3', purpose: 'Supports the center and prepares d4 expansion.' },
      { san: 'O-O', purpose: 'Castles early.' },
      { san: 'O-O', purpose: 'Castles kingside.' }
    ]
  },

  // ==========================================
  // 3. CARO-KANN DEFENSE
  // ==========================================
  {
    opening: 'Caro-Kann Defense (Advance Variation)',
    eco: 'B12',
    moves: [
      { san: 'e4', purpose: 'Controls central squares d5 and f5.' },
      { san: 'c6', purpose: 'Caro-Kann: prepares ...d5 while keeping the c8-h3 diagonal open for the bishop.' },
      { san: 'd4', purpose: 'Occupies the center with ideal pawn duo.' },
      { san: 'd5', purpose: 'Challenges White\'s e4 pawn directly in the center.' },
      { san: 'e5', purpose: 'Advance Variation: gains space on the kingside and locks the center.' },
      { san: 'Bf5', purpose: 'Crucial Caro-Kann theme: develops the bishop outside the pawn chain before playing ...e6.' },
      { san: 'Nf3', purpose: 'Develops kingside knight and controls the d4 and e5 pawns.' },
      { san: 'e6', purpose: 'Solidifies d5 and creates a rock-solid pawn structure.' },
      { san: 'Be2', purpose: 'Prepares kingside castling and keeps the bishop agile.' },
      { san: 'c5', purpose: 'The thematic Caro-Kann counter-break: strikes at the base of White\'s pawn chain on d4.' },
      { san: 'Be3', purpose: 'Bolsters the d4 pawn against Black\'s pressure.' },
      { san: 'Qb6', purpose: 'Pours pressure on b2 and d4 simultaneously.' },
      { san: 'Nc3', purpose: 'Develops knight and sacrifices b2 for overwhelming rapid development.' },
      { san: 'Nc6', purpose: 'Increases pressure on the d4 pawn.' },
      { san: 'O-O', purpose: 'Safeguards the king and brings the f1 rook into the game.' }
    ]
  },
  {
    opening: 'Caro-Kann Defense (Classical Variation)',
    eco: 'B18',
    moves: [
      { san: 'e4', purpose: 'Controls center.' },
      { san: 'c6', purpose: 'Prepares ...d5.' },
      { san: 'd4', purpose: 'Seizes center.' },
      { san: 'd5', purpose: 'Central challenge.' },
      { san: 'Nc3', purpose: 'Develops knight and protects e4.' },
      { san: 'dxe4', purpose: 'Liquidates the e4 pawn to open lines.' },
      { san: 'Nxe4', purpose: 'Recaptures in the center.' },
      { san: 'Bf5', purpose: 'Develops the bishop actively outside the pawn chain, targeting White\'s knight.' },
      { san: 'Ng3', purpose: 'Attacks Black\'s bishop with tempo.' },
      { san: 'Bg6', purpose: 'Preserves the bishop on the diagonal.' },
      { san: 'h4', purpose: 'Threatens to trap the bishop with h5.' },
      { san: 'h6', purpose: 'Carves out a retreat square on h7 for the bishop.' },
      { san: 'Nf3', purpose: 'Controls e5 and develops.' },
      { san: 'Nd7', purpose: 'Prevents White\'s knight from landing on the powerful Ne5 outpost.' },
      { san: 'h5', purpose: 'Gains space on the kingside and fixes Black\'s bishop on h7.' },
      { san: 'Bh7', purpose: 'Tucks the bishop into safe haven.' },
      { san: 'Bd3', purpose: 'Offers exchange of light-squared bishops to weaken Black\'s defense.' },
      { san: 'Bxd3', purpose: 'Trades bishops to relieve pressure.' },
      { san: 'Qxd3', purpose: 'Recaptures with queen, eyeing kingside attacking avenues.' },
      { san: 'e6', purpose: 'Solidifies the center and opens diagonals for black minor pieces.' }
    ]
  },
  {
    opening: 'Caro-Kann Defense (Exchange & Panov)',
    eco: 'B13',
    moves: [
      { san: 'e4', purpose: 'Controls center.' },
      { san: 'c6', purpose: 'Prepares ...d5.' },
      { san: 'd4', purpose: 'Seizes center.' },
      { san: 'd5', purpose: 'Challenges center.' },
      { san: 'exd5', purpose: 'Exchange Variation: clarifies the central tension.' },
      { san: 'cxd5', purpose: 'Recaptures toward the center, opening the c-file for Black.' },
      { san: 'Bd3', purpose: 'Prevents Black\'s bishop from reaching f5.' },
      { san: 'Nc6', purpose: 'Pressures d4.' },
      { san: 'c3', purpose: 'Solidifies d4 and blunts Black\'s c-file.' },
      { san: 'Nf6', purpose: 'Develops kingside knight.' },
      { san: 'Bf4', purpose: 'Controls the important b8-h2 diagonal.' },
      { san: 'Bg4', purpose: 'Pins White\'s knight or forces a concession.' },
      { san: 'Qb3', purpose: 'Attacks b7 and threatens Black\'s queenside.' }
    ]
  },

  // ==========================================
  // 4. SICILIAN DEFENSE
  // ==========================================
  {
    opening: 'Sicilian Defense (Najdorf Mainline)',
    eco: 'B90',
    moves: [
      { san: 'e4', purpose: 'Controls d5 and f5.' },
      { san: 'c5', purpose: 'Sicilian Defense: asymmetrical counter-attack fighting for the central d4 square.' },
      { san: 'Nf3', purpose: 'Prepares d2-d4 central opening.' },
      { san: 'd6', purpose: 'Controls e5 and prepares queenside pawn structures.' },
      { san: 'd4', purpose: 'Open Sicilian: opens central files for rapid piece activity.' },
      { san: 'cxd4', purpose: 'Trades wing pawn for White\'s central pawn, creating the semi-open c-file.' },
      { san: 'Nxd4', purpose: 'Centralizes the knight on d4.' },
      { san: 'Nf6', purpose: 'Attacks White\'s e4 pawn, forcing White to develop defensively.' },
      { san: 'Nc3', purpose: 'Defends e4 with natural knight development.' },
      { san: 'a6', purpose: 'The signature Najdorf move: takes away b5 from White pieces and prepares ...b5 expansion.' },
      { san: 'Be3', purpose: 'English Attack: prepares f3, Qd2, and long castling for a kingside storm.' },
      { san: 'e5', purpose: 'Seizes central space and drives White\'s knight away from d4.' },
      { san: 'Nb3', purpose: 'Retreats knight to safety while controlling c5.' },
      { san: 'Be6', purpose: 'Develops light-squared bishop to control the critical d5 hole.' },
      { san: 'f3', purpose: 'Cements e4, supports g4 kingside expansion, and stops ...Ng4.' },
      { san: 'Be7', purpose: 'Harmonious development preparing kingside castling.' },
      { san: 'Qd2', purpose: 'Prepares queenside castling (O-O-O) and connects rooks.' },
      { san: 'O-O', purpose: 'Secures kingside safety.' },
      { san: 'O-O-O', purpose: 'Castles long, launching opposite-side castling fireworks.' },
      { san: 'Nbd7', purpose: 'Develops knight to support ...b5 and contest c5.' }
    ]
  },
  {
    opening: 'Sicilian Defense (Dragon Variation)',
    eco: 'B70',
    moves: [
      { san: 'e4', purpose: 'Takes center.' },
      { san: 'c5', purpose: 'Sicilian fight for imbalance.' },
      { san: 'Nf3', purpose: 'Prepares d4.' },
      { san: 'd6', purpose: 'Solidifies center.' },
      { san: 'd4', purpose: 'Opens center.' },
      { san: 'cxd4', purpose: 'Captures toward open c-file.' },
      { san: 'Nxd4', purpose: 'Central knight recapture.' },
      { san: 'Nf6', purpose: 'Attacks e4.' },
      { san: 'Nc3', purpose: 'Defends e4.' },
      { san: 'g6', purpose: 'Dragon setup: prepares bishop fianchetto on g7 to breathe fire across the long diagonal.' },
      { san: 'Be3', purpose: 'Yugoslav Attack: prepares f3, Qd2, and kingside assault.' },
      { san: 'Bg7', purpose: 'Posts the Dragon bishop on the critical long diagonal.' },
      { san: 'f3', purpose: 'Prevents ...Ng4 and supports the g4 pawn push.' },
      { san: 'O-O', purpose: 'Castles kingside.' },
      { san: 'Qd2', purpose: 'Forms queen-bishop battery aiming at h6.' },
      { san: 'Nc6', purpose: 'Pressures d4.' },
      { san: 'Bc4', purpose: 'Restricts ...d5 break and targets f7.' },
      { san: 'Bd7', purpose: 'Prepares ...Rc8 and queenside counterplay.' },
      { san: 'O-O-O', purpose: 'Opposite-side castling attack.' }
    ]
  },
  {
    opening: 'Sicilian Defense (Alapin Variation 2.c3)',
    eco: 'B22',
    moves: [
      { san: 'e4', purpose: 'Takes center.' },
      { san: 'c5', purpose: 'Sicilian counterplay.' },
      { san: 'c3', purpose: 'Alapin Variation: establishes a supporting pawn to construct a full d4 pawn center.' },
      { san: 'd5', purpose: 'Direct central counterstrike against White\'s pawn center.' },
      { san: 'exd5', purpose: 'Takes the d5 pawn.' },
      { san: 'Qxd5', purpose: 'Recaptures with queen; White cannot play Nc3 to kick it with tempo.' },
      { san: 'd4', purpose: 'Establishes central pawn presence.' },
      { san: 'Nf6', purpose: 'Develops knight and pressures d4.' },
      { san: 'Nf3', purpose: 'Defends d4 and prepares kingside development.' },
      { san: 'e6', purpose: 'Solidifies center and opens lines for the dark-squared bishop.' },
      { san: 'Be2', purpose: 'Prepares kingside castling.' }
    ]
  },

  // ==========================================
  // 5. QUEEN'S GAMBIT (DECLINED & SLAV)
  // ==========================================
  {
    opening: 'Queen\'s Gambit Declined',
    eco: 'D30',
    moves: [
      { san: 'd4', purpose: 'Takes central space.' },
      { san: 'd5', purpose: 'Central anchor.' },
      { san: 'c4', purpose: 'Offers a wing pawn to deflect Black\'s d5 pawn and dominate the center.' },
      { san: 'e6', purpose: 'QGD: declines the gambit to firmly anchor the d5 stronghold.' },
      { san: 'Nc3', purpose: 'Piles pressure onto the d5 point.' },
      { san: 'Nf6', purpose: 'Defends d5 and develops kingside minor pieces.' },
      { san: 'Bg5', purpose: 'Pins the f6 knight defending d5.' },
      { san: 'Be7', purpose: 'Unpins the knight and prepares kingside castling.' },
      { san: 'e3', purpose: 'Solidifies d4 and opens diagonals for the light-squared bishop.' },
      { san: 'O-O', purpose: 'Secures kingside safety.' },
      { san: 'Nf3', purpose: 'Harmonious kingside knight development.' },
      { san: 'Nbd7', purpose: 'Supports ...c5 or ...e5 breaks while keeping d5 defended.' },
      { san: 'Rc1', purpose: 'Places rook on the semi-open c-file anticipating central opening.' },
      { san: 'c6', purpose: 'Consolidates the d5 pawn pyramid.' },
      { san: 'Bd3', purpose: 'Develops bishop along active diagonal.' },
      { san: 'dxc4', purpose: 'Capablanca freeing maneuver: trades to gain tempos with ...Nd5.' },
      { san: 'Bxc4', purpose: 'Recaptures on c4 with tempo.' },
      { san: 'Nd5', purpose: 'Initiates piece trades to alleviate Black\'s cramped position.' }
    ]
  },
  {
    opening: 'Slav Defense',
    eco: 'D10',
    moves: [
      { san: 'd4', purpose: 'Central pawn push.' },
      { san: 'd5', purpose: 'Central anchor.' },
      { san: 'c4', purpose: 'Queen\'s Gambit challenge.' },
      { san: 'c6', purpose: 'Slav Defense: supports d5 with a pawn without trapping the c8 bishop.' },
      { san: 'Nf3', purpose: 'Controls e5 and develops kingside.' },
      { san: 'Nf6', purpose: 'Defends d5 and prepares kingside development.' },
      { san: 'Nc3', purpose: 'Pressures d5.' },
      { san: 'dxc4', purpose: 'Accepts the pawn temporarily to exploit White\'s development lag.' },
      { san: 'a4', purpose: 'Prevents Black from holding the c4 pawn with ...b5.' },
      { san: 'Bf5', purpose: 'Activates the bishop outside the pawn chain before playing ...e6.' },
      { san: 'e3', purpose: 'Prepares to recapture on c4 with the bishop.' },
      { san: 'e6', purpose: 'Solidifies the center.' },
      { san: 'Bxc4', purpose: 'Recaptures the pawn with active piece development.' },
      { san: 'Bb4', purpose: 'Pins the c3 knight and prepares castling.' },
      { san: 'O-O', purpose: 'Secures kingside safety.' },
      { san: 'O-O', purpose: 'Completes castling.' }
    ]
  },

  // ==========================================
  // 6. FRENCH DEFENSE
  // ==========================================
  {
    opening: 'French Defense (Advance Variation)',
    eco: 'C02',
    moves: [
      { san: 'e4', purpose: 'Takes central space.' },
      { san: 'e6', purpose: 'French Defense: prepares ...d5 to contest White\'s center.' },
      { san: 'd4', purpose: 'Full classical pawn center.' },
      { san: 'd5', purpose: 'Strikes at White\'s e4 pawn.' },
      { san: 'e5', purpose: 'Advance Variation: closes the center and gains space on the kingside.' },
      { san: 'c5', purpose: 'The fundamental French counter-break: hammers the base of White\'s pawn chain on d4.' },
      { san: 'c3', purpose: 'Reinforces the d4 pawn anchor.' },
      { san: 'Nc6', purpose: 'Piles additional pressure on White\'s d4 pawn.' },
      { san: 'Nf3', purpose: 'Defends d4 with knight development.' },
      { san: 'Qb6', purpose: 'Adds a third attacker against d4 and attacks b2.' },
      { san: 'Be2', purpose: 'Prepares kingside castling.' },
      { san: 'cxd4', purpose: 'Clarifies tension on d4.' },
      { san: 'cxd4', purpose: 'Recaptures to maintain the central pawn wedge.' },
      { san: 'Nge7', purpose: 'Develops knight toward f5 to add a fourth attacker to d4.' },
      { san: 'Na3', purpose: 'Maneuvers knight via c2 to bolster the d4 defense.' },
      { san: 'Nf5', purpose: 'Maximal pressure on White\'s d4 pawn.' },
      { san: 'Nc2', purpose: 'Firmly locks down defense of d4.' }
    ]
  },
  {
    opening: 'French Defense (Winawer Variation)',
    eco: 'C15',
    moves: [
      { san: 'e4', purpose: 'Takes center.' },
      { san: 'e6', purpose: 'French setup.' },
      { san: 'd4', purpose: 'Classical center.' },
      { san: 'd5', purpose: 'Challenges center.' },
      { san: 'Nc3', purpose: 'Defends e4 while developing knight.' },
      { san: 'Bb4', purpose: 'Winawer: pins White\'s knight against the king, undermining e4.' },
      { san: 'e5', purpose: 'Gains kingside space and locks center.' },
      { san: 'c5', purpose: 'Undermines d4.' },
      { san: 'a3', purpose: 'Forces Black\'s bishop to make a decision.' },
      { san: 'Bxc3+', purpose: 'Inflicts doubled c-pawns on White.' },
      { san: 'bxc3', purpose: 'Recaptures, gaining the bishop pair at cost of doubled pawns.' },
      { san: 'Ne7', purpose: 'Develops knight without blocking ...f6 or the queen.' }
    ]
  },

  // ==========================================
  // 7. RUY LOPEZ (SPANISH OPENING)
  // ==========================================
  {
    opening: 'Ruy Lopez (Closed Mainline)',
    eco: 'C84',
    moves: [
      { san: 'e4', purpose: 'Controls center.' },
      { san: 'e5', purpose: 'Establishes central equality.' },
      { san: 'Nf3', purpose: 'Attacks e5.' },
      { san: 'Nc6', purpose: 'Defends e5.' },
      { san: 'Bb5', purpose: 'Pressures the knight defending Black\'s e5 pawn.' },
      { san: 'a6', purpose: 'Asks the question of the Spanish bishop.' },
      { san: 'Ba4', purpose: 'Maintains the pin along the a4-e8 diagonal.' },
      { san: 'Nf6', purpose: 'Attacks White\'s e4 pawn.' },
      { san: 'O-O', purpose: 'Castles into safety, offering e4 as an exchange.' },
      { san: 'Be7', purpose: 'Harmonious development preparing castling.' },
      { san: 'Re1', purpose: 'Safeguards e4 and prepares the Spanish central maneuvering.' },
      { san: 'b5', purpose: 'Breaks the pin on the knight.' },
      { san: 'Bb3', purpose: 'Retreats bishop to dominant a2-g8 diagonal.' },
      { san: 'd6', purpose: 'Solidifies the e5 pawn stronghold.' },
      { san: 'c3', purpose: 'Carves out c2 refuge for the bishop and prepares d4.' },
      { san: 'O-O', purpose: 'Completes castling.' },
      { san: 'h3', purpose: 'Prevents ...Bg4 pin on White\'s knight.' }
    ]
  },
  {
    opening: 'Ruy Lopez (Berlin Defense)',
    eco: 'C65',
    moves: [
      { san: 'e4', purpose: 'Controls center.' },
      { san: 'e5', purpose: 'Central symmetry.' },
      { san: 'Nf3', purpose: 'Attacks e5.' },
      { san: 'Nc6', purpose: 'Defends e5.' },
      { san: 'Bb5', purpose: 'Spanish bishop.' },
      { san: 'Nf6', purpose: 'Berlin Defense: immediate counter-pressure against White\'s e4 pawn.' },
      { san: 'O-O', purpose: 'Sacrifices e4 pawn for rapid development.' },
      { san: 'Nxe4', purpose: 'Captures the e4 pawn, heading into the Berlin Wall.' },
      { san: 'd4', purpose: 'Opens the central e-file against Black\'s king.' },
      { san: 'Nd6', purpose: 'Attacks White\'s b5 bishop with tempo.' },
      { san: 'Bxc6', purpose: 'Trades bishop for knight.' },
      { san: 'dxc6', purpose: 'Recaptures toward the center, opening lines for both bishops.' },
      { san: 'dxe5', purpose: 'Recaptures pawn.' },
      { san: 'Nf5', purpose: 'Repositioning knight to an active central post.' },
      { san: 'Qxd8+', purpose: 'Exchanges queens into the famous Berlin endgame.' },
      { san: 'Kxd8', purpose: 'Forfeits castling rights, but secures resilient bishop pair defense.' }
    ]
  },

  // ==========================================
  // 8. KING'S INDIAN & GRÜNFELD
  // ==========================================
  {
    opening: 'King\'s Indian Defense (Classical)',
    eco: 'E92',
    moves: [
      { san: 'd4', purpose: 'Takes central space.' },
      { san: 'Nf6', purpose: 'Flexible Indian defense.' },
      { san: 'c4', purpose: 'Controls d5 and takes queenside space.' },
      { san: 'g6', purpose: 'Prepares kingside fianchetto.' },
      { san: 'Nc3', purpose: 'Controls e4 and d5.' },
      { san: 'Bg7', purpose: 'Posts bishop on the long diagonal.' },
      { san: 'e4', purpose: 'Establishes full central pawn trio.' },
      { san: 'd6', purpose: 'Prevents White from pushing e5 and prepares ...e5.' },
      { san: 'Nf3', purpose: 'Harmonious kingside knight development.' },
      { san: 'O-O', purpose: 'Secures kingside safety.' },
      { san: 'Be2', purpose: 'Classical King\'s Indian setup.' },
      { san: 'e5', purpose: 'The vital KID strike: directly challenges White\'s pawn center.' },
      { san: 'O-O', purpose: 'Castles kingside.' },
      { san: 'Nc6', purpose: 'Pressures d4, forcing White to decide on the center.' },
      { san: 'd5', purpose: 'Locks the center, initiating the legendary opposite-wing race.' },
      { san: 'Ne7', purpose: 'Reroutes the knight to f5/g6 to support the kingside pawn avalanche.' }
    ]
  },
  {
    opening: 'Grünfeld Defense',
    eco: 'D85',
    moves: [
      { san: 'd4', purpose: 'Takes center.' },
      { san: 'Nf6', purpose: 'Indian defense.' },
      { san: 'c4', purpose: 'Queenside space.' },
      { san: 'g6', purpose: 'Prepares fianchetto.' },
      { san: 'Nc3', purpose: 'Controls e4.' },
      { san: 'd5', purpose: 'Grünfeld Defense: hypermodern strike challenging White\'s center directly.' },
      { san: 'cxd5', purpose: 'Exchange Grünfeld: takes the pawn to establish a dominant pawn center.' },
      { san: 'Nxd5', purpose: 'Recaptures with active knight in the center.' },
      { san: 'e4', purpose: 'Seizes full pawn center, kicking Black\'s knight.' },
      { san: 'Nxc3', purpose: 'Trades knights to avoid losing tempos.' },
      { san: 'bxc3', purpose: 'Builds massive pawn center.' },
      { san: 'Bg7', purpose: 'Targets White\'s c3-d4 center along the long diagonal.' },
      { san: 'Bc4', purpose: 'Develops bishop pointing at f7.' },
      { san: 'c5', purpose: 'The thematic Grünfeld strike: immediately undermines White\'s d4 center.' }
    ]
  },

  // ==========================================
  // 9. ENGLISH OPENING & RÉTI
  // ==========================================
  {
    opening: 'English Opening',
    eco: 'A20',
    moves: [
      { san: 'c4', purpose: 'Controls d5 from the flank, keeping central pawn options flexible.' },
      { san: 'e5', purpose: 'Reversed Sicilian: establishes immediate central pawn presence.' },
      { san: 'Nc3', purpose: 'Develops knight and controls d5 and e4.' },
      { san: 'Nf6', purpose: 'Develops kingside knight and controls d5.' },
      { san: 'Nf3', purpose: 'Attacks Black\'s e5 pawn.' },
      { san: 'Nc6', purpose: 'Four Knights English: defends e5.' },
      { san: 'g3', purpose: 'Prepares bishop fianchetto to dominate the long diagonal.' },
      { san: 'Bb4', purpose: 'Pins the c3 knight and prepares castling.' },
      { san: 'Bg2', purpose: 'Dominates the long dark diagonal.' },
      { san: 'O-O', purpose: 'Secures kingside safety.' },
      { san: 'O-O', purpose: 'Completes castling.' }
    ]
  },

  // ==========================================
  // 10. SCANDINAVIAN DEFENSE
  // ==========================================
  {
    opening: 'Scandinavian Defense',
    eco: 'B01',
    moves: [
      { san: 'e4', purpose: 'Takes center.' },
      { san: 'd5', purpose: 'Scandinavian Defense: challenges White\'s e4 pawn on move 1.' },
      { san: 'exd5', purpose: 'Takes the pawn.' },
      { san: 'Qxd5', purpose: 'Recaptures with queen.' },
      { san: 'Nc3', purpose: 'Develops knight with tempo against Black\'s queen.' },
      { san: 'Qa5', purpose: 'Mainline retreat: pins or sidelines the queen safely while controlling a5.' },
      { san: 'd4', purpose: 'Establishes full pawn center.' },
      { san: 'Nf6', purpose: 'Develops knight and controls e4.' },
      { san: 'Nf3', purpose: 'Develops kingside knight.' },
      { san: 'c6', purpose: 'Builds a Caro-Kann-like pawn shell providing retreat squares on d8/c7.' },
      { san: 'Bc4', purpose: 'Active bishop development aiming at f7.' },
      { san: 'Bf5', purpose: 'Develops bishop outside the pawn chain before playing ...e6.' }
    ]
  }
]

/**
 * In-memory index of theory positions and moves.
 * Keyed by normalized FEN: fen.split(' ').slice(0, 3).join(' ')
 */
interface TheoryNode {
  opening: string
  eco: string
  bookMoves: Record<string, { purpose: string; nextFenKey: string; openingName?: string }>
}

const theoryMap = new Map<string, TheoryNode>()
const theoryPositionKeys = new Set<string>()

// Populate the index from THEORY_LINES
function buildTheoryIndex() {
  for (const line of THEORY_LINES) {
    const chess = new Chess()
    let currentKey = chess.fen().split(' ').slice(0, 3).join(' ')
    theoryPositionKeys.add(currentKey)

    for (const move of line.moves) {
      let node = theoryMap.get(currentKey)
      if (!node) {
        node = {
          opening: line.opening,
          eco: line.eco,
          bookMoves: {}
        }
        theoryMap.set(currentKey, node)
      }

      try {
        const m = chess.move(move.san)
        if (!m) break
        const nextKey = chess.fen().split(' ').slice(0, 3).join(' ')
        theoryPositionKeys.add(nextKey)

        if (!node.bookMoves[move.san]) {
          node.bookMoves[move.san] = {
            purpose: move.purpose,
            nextFenKey: nextKey,
            openingName: line.opening
          }
        }
        currentKey = nextKey
      } catch {
        break
      }
    }
  }
}

// Build index once at module load
buildTheoryIndex()

export function isTheoryPosition(fen: string): boolean {
  const key = fen.split(' ').slice(0, 3).join(' ')
  return theoryPositionKeys.has(key)
}

/**
 * Checks whether a given move in a position conforms to opening theory.
 * Returns purpose description and deviation details if player stepped out of book.
 */
export function lookupTheoryMove(
  fenBefore: string,
  moveSan: string,
  fenAfter: string
): TheoryMoveResult {
  const beforeKey = fenBefore.split(' ').slice(0, 3).join(' ')
  const afterKey = fenAfter.split(' ').slice(0, 3).join(' ')

  const node = theoryMap.get(beforeKey)

  // 1. Direct match in our curated theory move map
  if (node && node.bookMoves[moveSan]) {
    const matched = node.bookMoves[moveSan]
    return {
      isBook: true,
      openingName: matched.openingName || node.opening,
      eco: node.eco,
      purpose: matched.purpose
    }
  }

  // 2. Transpositional check: is fenAfter in our theory position set?
  if (theoryPositionKeys.has(afterKey)) {
    const nextNode = theoryMap.get(afterKey)
    return {
      isBook: true,
      openingName: nextNode?.opening || node?.opening || 'Opening Theory',
      eco: nextNode?.eco || node?.eco || 'A00',
      purpose: getGeneralOpeningPurpose(moveSan, nextNode?.opening || node?.opening)
    }
  }

  // 3. Check against openings.json dictionary for naming context (not an approved book continuation)
  if (openingsDict[afterKey]) {
    const dict = openingsDict[afterKey]
    return {
      isBook: false,
      openingName: dict.name,
      eco: dict.eco,
      purpose: getGeneralOpeningPurpose(moveSan, dict.name)
    }
  }

  // 4. Position was in book, but played move is NOT a book continuation -> DEVIATION
  if (node && Object.keys(node.bookMoves).length > 0) {
    const availableBookMoves = Object.keys(node.bookMoves)
    const topBookMove = availableBookMoves[0]
    return {
      isBook: false,
      openingName: node.opening,
      eco: node.eco,
      deviation: {
        openingName: node.opening,
        eco: node.eco,
        bookMoves: availableBookMoves,
        bookMovePurposes: Object.fromEntries(
          availableBookMoves.map((m) => [m, node.bookMoves[m].purpose])
        ),
        recommendedMove: topBookMove,
        recommendedPurpose: node.bookMoves[topBookMove].purpose
      }
    }
  }

  return { isBook: false }
}

/**
 * Returns available book moves from a position, if known.
 */
export function getTheoryBookMoves(fen: string): string[] {
  const key = fen.split(' ').slice(0, 3).join(' ')
  const node = theoryMap.get(key)
  return node ? Object.keys(node.bookMoves) : []
}

/**
 * Generates an opening-aware explanation for a standard book move
 * when a specific annotated string is not present in the table.
 */
function getGeneralOpeningPurpose(san: string, openingName?: string): string {
  const name = openingName ? `in the ${openingName}` : 'in the opening'

  if (san.includes('O-O-O')) {
    return `Castles queenside ${name}, shielding the king and activating the d1/d8 rook.`
  }
  if (san.includes('O-O')) {
    return `Castles kingside ${name}, prioritizing king safety and activating the rook.`
  }
  if (san.startsWith('N')) {
    return `Develops the knight toward central control ${name}, preparing coordination and castling.`
  }
  if (san.startsWith('B')) {
    return `Develops the bishop along an active diagonal ${name}, challenging key central squares.`
  }
  if (san.startsWith('R')) {
    return `Places the rook on an active file ${name} to support central pawn breaks.`
  }
  if (san.startsWith('Q')) {
    return `Activates the queen ${name} to harmonize minor pieces without premature exposure.`
  }
  if (san === 'c3' || san === 'c6') {
    return `Reinforces the central pawn anchor ${name} and blunts opponent counterplay.`
  }
  if (san === 'c4' || san === 'c5') {
    return `Strikes at the opponent's pawn center ${name}, fighting for central space.`
  }
  if (san === 'd4' || san === 'd5' || san === 'e4' || san === 'e5') {
    return `Establishes a solid central pawn presence ${name} controlling vital squares.`
  }
  if (san === 'e3' || san === 'e6' || san === 'd3' || san === 'd6') {
    return `Solidifies the pawn structure ${name} while opening diagonals for piece development.`
  }

  return `Established grandmaster opening theory ${name} contesting central control.`
}
