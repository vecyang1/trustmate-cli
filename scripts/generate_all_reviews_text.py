import json

reviews_text = {}

def add(rev_id, headline, body):
    headline = headline.strip()
    body = body.strip()
    assert '!' not in headline, f"Exclamation in headline: {headline}"
    assert '!' not in body, f"Exclamation in body: {body}"
    assert rev_id not in reviews_text, f"Duplicate id: {rev_id}"
    assert headline not in [v['headline'] for v in reviews_text.values()], f"Duplicate headline: {headline}"
    assert body not in [v['body'] for v in reviews_text.values()], f"Duplicate body: {body}"
    reviews_text[rev_id] = {'headline': headline, 'body': body}

# =========================================================================
# BLOCK 1: gm-rev-001 to gm-rev-048 (48 reviews)
# =========================================================================

# 1. Product 2375: Raw Selenite Cleansing Plate & Velvet Ritual Pouch (12 items)
add('gm-rev-001', 'Essential nighttime ritual for resetting daily pieces',
    'Substantial weight and a silky, cool touch. I use this every evening to rest my gemstone bracelets after long screen-facing workdays. It looks like an architectural artifact on my bedside table.')

add('gm-rev-002', 'A tactile sanctuary for resetting mind and jewelry',
    'The texture is authentically natural with subtle feathered veils inside the stone. Paired with the velvet ritual pouch, the unboxing felt like receiving a museum piece.')

add('gm-rev-003', 'Architectural mineral presence on the nightstand',
    'Having an authentic gypsum charging plate makes daily jewelry care effortless. The edge carving preserves the raw mineral boundary while the top surface is smoothly hollowed to cradle multiple pieces securely.')

add('gm-rev-004', 'Milky crystalline striations that catch soft ambient light',
    'The selenite plate arrived safely wrapped in dense raw linen and a deep forest green velvet pouch. Placing my rings and bracelets on the milky crystalline surface overnight has become an indispensable ritual. The natural mineral striations catch ambient evening lamp light with serene warmth.')

add('gm-rev-005', 'Reassuringly dense and cool to the touch',
    'The crystalline glow of the selenite when placed near a soft reading lamp creates an instant sense of calm. It feels reassuringly dense and keeps my daily pieces organized in one dedicated space.')

add('gm-rev-006', 'Sculptural elegance that honors earth-mined minerals',
    'Noticeable mineral heft and cool smoothness. The subtle translucency of the raw gypsum gives it an ancient, grounding aesthetic that completely elevates my nightstand.')

add('gm-rev-007', 'A quiet tactile bookend to demanding workdays',
    'A quiet ritual to bookend the day. Laying my quartz and tourmaline pieces on the plate overnight has become second nature, and the unboxing packaging was breathtakingly minimalist.')

add('gm-rev-008', 'Delicate natural cleavage lines with silky surface polish',
    'The hand-carved finish retains the organic crystalline structure along the sides while offering a perfectly level resting plane for rings and pendants. Truly understated craftsmanship.')

add('gm-rev-009', 'Pearlescent sheen under soft morning light',
    'Beautifully carved from genuine fibrous gypsum. It catches soft morning light with a pearlescent sheen. Arrived in an exquisite dark velvet pouch that I now use for travel.')

add('gm-rev-010', 'A dedicated sacred space for gemstone care',
    'An elegant solution for clearing visual clutter on the dresser while giving my daily jewelry a safe sanctuary. The stone feels cool to the touch and undeniably authentic.')

add('gm-rev-011', 'Natural feathered veils that prove earth-mined origin',
    'Natural feathered veils run throughout the stone, proving its earth-mined origin. It feels like having a private gallery artifact dedicated to nightly restoration.')

add('gm-rev-012', 'Satiny luster that anchors my evening unwinding routine',
    'The selenite has a lovely satiny luster and comforting weight. The velvet pouch protects it during transit, and it has anchored my evening unwinding routine.')

# 2. Product 1594: Black Knight Spinel Pearl Necklace (10 items)
add('gm-rev-013', 'The micro-faceted spinel catches candlelight with quiet brilliance',
    'Finding pearl jewelry that avoids looking traditional or dated can be difficult. This piece balances sharp mineral black with soft organic luster in a way that feels contemporary and refined.')

add('gm-rev-014', 'Arrived in an embossed linen presentation box that exceeded expectations',
    'The contrast between the faceted micro-spinel beads and the baroque freshwater pearl is striking without being loud. It sits comfortably along the collarbone with substantial weight. I receive quiet inquiries every time I wear it to private viewings.')

add('gm-rev-015', 'Lustrous baroque pearl that rests flat along the collarbone',
    'Worn both with a tailored charcoal blazer and an open linen collar. The clasp mechanism is secure and discrete, and the pearl has a beautiful natural orient.')

add('gm-rev-016', 'Understated contrast that transitions effortlessly from gallery to dinner',
    'The dark spinel facet cuts reflect micro-points of ambient restaurant light while the baroque freshwater pearl provides an organic centerpiece. It drapes naturally against silk shirts.')

add('gm-rev-017', 'Modern heirloom aesthetic with delicate structural balance',
    'The craftsmanship is evident in the precision of the knotting between each faceted spinel bead. The pearl has natural baroque contours that feel sculptural rather than mass-produced.')

add('gm-rev-018', 'Distinct faceted facets that shimmer without ostentation',
    'This necklace manages to look sharp yet poetic. The black spinel has deep obsidian-like depth, and the central freshwater pearl has subtle iridescent cream and silver undertones.')

# 4-star constructive review
add('gm-rev-019', 'Exceptional stone quality though transit took twelve days',
    'The mineral depth and unheated color of the beads exceeded my expectations, and the velvet pouch is beautiful. Delivery to Melbourne took twelve business days, which is understandable for international tracked shipping, but I was so eager for it to arrive. Once unboxed, the piece is absolutely five stars.')

add('gm-rev-020', 'Luminous pearl orient paired with deep nocturnal mineral black',
    'The baroque freshwater pearl has an asymmetrical, sculptural silhouette that feels entirely unique. The faceted spinel feels silky against bare skin and holds room temperature gracefully.')

add('gm-rev-021', 'Refined neckpiece that sits effortlessly under a tailored lapel',
    'The contrast between the dark spinel facet reflections and the warm baroque pearl luster creates an architectural rhythm. The silk cord is securely knotted and feels durable.')

add('gm-rev-022', 'Contemporary interpretation of classic pearl strand aesthetics',
    'Finding pearl jewelry that feels youthful and design-forward is rare. GlintMuse achieved an effortless balance here that pairs as naturally with white tees as with formal suiting.')

# 3. Product 758: 7 Chakra Bracelet - Balance All Energy Centers (10 items)
add('gm-rev-023', 'A mindful companion for morning breathwork and desk resets',
    'Many multi-stone chakra bracelets look artificial or excessively colorful. GlintMuse curated authentic stones with muted, sophisticated natural hues. Rotating through the beads during morning breathwork has anchored my morning routine.')

add('gm-rev-024', 'Authentic mineral density that proves genuine untreated stones',
    'Gave this to my sister for her milestone birthday after she completed her yoga teacher training. She commented on how each gemstone felt distinctly weighted and authentic.')

add('gm-rev-025', 'Refined graduation of colors that avoids costume aesthetics',
    'The transition from red jasper through lapis lazuli and amethyst feels natural and balanced. The stones have a reassuring cool temperature on the skin and the spacing is comfortable for all-day wear.')

add('gm-rev-026', 'Harmonious spectrum of genuine stones with distinct tactile feedback',
    'Each bead offers subtle tactile feedback as fingers move across the circumference. The deep blue sodalite and earthy red jasper feel grounding during meditation.')

add('gm-rev-027', 'Balanced energy centers that offer steady daily alignment',
    'The stones have a soothing, cool weight on the wrist. Wearing it during long studio design sessions serves as a subtle reminder to maintain physical posture and breathe deeply.')

add('gm-rev-028', 'Subtle earthy graduation that feels grounded rather than loud',
    'The natural mineral colors are understated and tasteful. It complements silver and bronze jewelry without clashing, and the elastic retention is durable.')

add('gm-rev-029', 'Distinct mineral variations across all seven natural gemstones',
    'Each bead has its own natural inclusions, from the golden pyrite specks in the lapis to the soft banding in the jasper. The elastic cord has maintained firm tension over weeks of daily wear.')

add('gm-rev-030', 'Tactile mindfulness tool during high-pressure negotiations',
    'Holding the cool lapis and amethyst beads between thumb and forefinger during tense conference calls provides an instant sense of somatic grounding. Truly thoughtful craftsmanship.')

add('gm-rev-031', 'Mature palette of earth-mined stones with velvety polish',
    'Appreciate that the stones are not artificially dyed or coated in glossy lacquer. The matte satiny polish feels organic and dignifies the wearer.')

add('gm-rev-032', 'Seamless transition from workout studio to executive meetings',
    'It wears comfortably during morning yoga without slipping and looks understated enough to keep on beneath a button-down shirt at the office.')

# 4. Product 774: Golden Rutilated Quartz - Wealth Magnet Bracelet (8 items)
add('gm-rev-033', 'Fascinating golden needle inclusions under direct sunlight',
    'The density of golden rutile needles suspended inside clear quartz crystal is mesmerizing. Each bead has an entirely distinct microscopic landscape. It pairs effortlessly beside my stainless steel automatic watch.')

add('gm-rev-034', 'A quiet statement piece that draws subtle inquiries',
    'The craftsmanship is evident in how cleanly the beads are polished without muting the internal mineral inclusions. Substantial weight on the wrist and the elastic cord maintains firm retention.')

add('gm-rev-035', 'The collector-grade quartz transparency is genuine',
    'Under bright daylight, the golden threads catch reflections like spun silk frozen in glass. It has become my favorite accessory for client presentations where understated confidence matters.')

add('gm-rev-036', 'Crisp mineral clarity with substantial tactile presence',
    'Each sphere reveals intersecting strands of golden rutile that shimmer when moving the hand. The transparency of the host quartz is crystalline, with zero cloudiness.')

add('gm-rev-037', 'Golden rutile needles like microscopic frozen landscapes',
    'The golden threads have an organic geometric pattern that looks like fine filigree art. It gives off a quiet glow without looking like costume jewelry.')

add('gm-rev-038', 'Executive presence that complements automatic timepieces',
    'Worn alongside my black-dial mechanical watch, this bracelet adds a refined mineral warmth. The polish is smooth and never snags shirt cuffs.')

add('gm-rev-039', 'Pristine quartz clarity with vibrant rutile density',
    'The beads are exceptionally clean with dense golden hair striations running through them. The presentation packaging and linen card added to the sense of occasion.')

add('gm-rev-040', 'Subtle warmth that complements timepieces and cuffs',
    'The stones have a soothing, substantial heft. GlintMuse selected genuine untreated rutilated quartz of a quality that normally costs significantly more in specialty boutiques.')

# 5. Product 2317: The Soul Connection Duo Gift Set (8 items)
add('gm-rev-041', 'An anniversary gesture that carried genuine emotional resonance',
    'My partner and I wanted pieces that felt interconnected without matching identically. This duo set balanced contrasting energies beautifully. The tactile feedback of the stones is soothing during long flights, and the packaging presentation required no additional wrapping.')

add('gm-rev-042', 'Thoughtful gift packaging that made the celebration unforgettable',
    'The duo gift set arrived in a double-compartment linen keepsake box. The contrast between the grounding dark stones and the luminous accent piece feels intentional and deeply romantic.')

# 4-star constructive review
add('gm-rev-043', 'Subtle earthy variation that proves genuine mineral origin',
    'The stones have slightly more organic mineral veiling than the bright studio photos, which I actually appreciate because it proves they are unheated earth-mined gems. The fit was slightly snug for the first evening, but the cord relaxed naturally after twenty-four hours of wear.')

add('gm-rev-044', 'Harmonious connection between two distinct mineral energies',
    'We wear these every day across two different cities. Having a matching physical stone on the wrist bridges the distance with a quiet tactile warmth.')

add('gm-rev-045', 'Interconnected gemstone pairing with understated sophistication',
    'Both bracelets exhibit masterful lapidary polish. The sizing corresponds accurately to the guide, and the cords have maintained their shape through weeks of continuous wear.')

add('gm-rev-046', 'A meaningful shared anchor for long-distance partnership',
    'The tactile weight of these natural stones brings a steady grounding feeling throughout busy workdays. My husband and I both appreciate the subdued color tones.')

add('gm-rev-047', 'Artisanal gift box presentation with handwritten care details',
    'Everything from the textured outer linen wrap to the individual velvet pouches reflected exceptional care. The duo set feels bespoke and deeply considered.')

add('gm-rev-048', 'Complementary stones that celebrate individuality within unity',
    'The stones feel distinctly cool upon putting them on in the morning. A beautifully designed duo that avoids the cliché of identical couple jewelry.')

print(f"Block 1 complete: {len(reviews_text)} items defined.")

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import review_texts_block2 as b2
import review_texts_block3 as b3
import review_texts_block4 as b4
import review_texts_block5 as b5

for rev_id, headline, body in b2.BLOCK_2_REVIEWS:
    add(rev_id, headline, body)
print(f"Block 2 added: total {len(reviews_text)} items.")

for rev_id, headline, body in b3.BLOCK_3_REVIEWS:
    add(rev_id, headline, body)
print(f"Block 3 added: total {len(reviews_text)} items.")

for rev_id, headline, body in b4.BLOCK_4_REVIEWS:
    add(rev_id, headline, body)
print(f"Block 4 added: total {len(reviews_text)} items.")

for rev_id, headline, body in b5.BLOCK_5_REVIEWS:
    add(rev_id, headline, body)
print(f"Block 5 added: total {len(reviews_text)} items.")

assert len(reviews_text) == 218, f"Expected 218 items, got {len(reviews_text)}"
print("All 218 reviews text loaded and verified!")
