const path = require('path');

module.exports = {
  // H-004a: the model that writes this text's replies and evolves its sections (H-007: now also the shared default).
  model: 'claude-sonnet-5-5',

  // H-007: how the conversation names this text's voice when it is folded into an evolved section.
  voiceName: 'Text',

  // H-011: editorial readings and evolution without forced tool calls, so they run on claude-sonnet-5-5
  // and keep the whole pipeline (revision pass, citation notes, main line, introductions).
  editorialDelivery: 'markers',

  sectionsDir: path.join(__dirname, 'source_texts', 'sections'),

  sectionFiles: [
    'section-1.md',
    'section-2.md',
    'section-3.md',
    'section-4.md',
    'section-5.md',
    'section-6.md',
    'section-7.md',
    // H-014: chapter 2, Popular Modernism.
    'section-8.md',
    'section-9.md',
    'section-10.md',
    'section-11.md',
    'section-12.md',
    'section-13.md',
    'section-14.md',
    'section-15.md',
    // H-015: chapter 3, Dichotomies.
    'section-16.md',
    'section-17.md',
    'section-18.md',
  ],

  sectionNames: [
    'The Great Divide',
    'The Philadelphia (Orchestra) Story',
    'Class in America',
    'The Case of Music',
    'Shocking Art',
    'Art as a Special Interest',
    'Communities and Creativity',
    "Popular Modernism",
    "Popular Modernism: Formal, Progressive and Avant-Garde",
    "Popular Music and Formal Modernism",
    "John Lennon and Yoko Ono as Political Modernists",
    "McLuhan and Popular Modernism",
    "Steve Jobs",
    "The Future as Popular Modernist Kitsch",
    "Forgetting (Popular) Modernism",
    "Dichotomies",
    "The Rise of Popular Modernism",
    "Describing the Plenitude",
  ],

  sectionIntros: [
    `In 2013 JAY-Z released “Picasso Baby,” a song and a video: the rapper wants to own a Picasso and ends by claiming to be a new Picasso. He is performing in New York’s Pace Gallery, one of the city’s prestigious art spaces. Art-world figures and fans take turns standing across from him while he raps. Marina Abramović, whose MoMA performance of 2010 he was borrowing (she sat motionless for more than two months, staring at one stranger after another), appears as one of his partners. Everyone in the film is delighted that the art world has accepted the rapper as an artist. The great divide between elite art and popular culture is in the process of dissolving.`,

    `In 1940 Leopold Stokowski, the flamboyant conductor who had led the Philadelphia Orchestra for more than two decades, appeared in Disney’s Fantasia as a silhouette, and Mickey Mouse treated him with nervous reverence. Even that was too much for one newspaper columnist, who called the film a symptom of “the collapse of the civilized world.” Seventeen years later, in the cartoon What’s Opera, Doc?, Bugs Bunny played Brünnhilde to Elmer Fudd’s Siegfried, with no reverence at all. In April 2011 the Philadelphia Orchestra filed for bankruptcy, the first of America’s “Big Five” orchestras to do so. Opera and the symphony have lost their claim to cultural preeminence: there is in fact no longer any music that every educated person is expected to know.`,

    `In 1926 F. Scott Fitzgerald wrote that the very rich are different from you and me. Twelve years later Ernest Hemingway borrowed the line and added: yes, they have more money. American culture has come round to Hemingway. The society column, still a fixture of the newspaper in 1940, when The Philadelphia Story put Main Line high society on the screen, is now an amusing relic. A “socialite” like Paris Hilton became famous for being famous, and royalty borrow their celebrity from rock and movie stars, not the reverse. Once no class could claim to be essentially different, no art could claim to be essentially higher. The old hierarchy of taste survives only in fragments, and not everyone shares them.`,

    `When the rock and roll pioneer Chuck Berry sang “Roll Over Beethoven,” he meant no hostility. He and his young audience did not know or care about the classical tradition, and Beethoven was simply the name for the music his own was replacing. By the end of the century, American culture had largely accepted that rock, country, hip-hop and symphonic music all have equal creative potential. Wikipedia lists well over a hundred genres of rock alone. In 2018 the opera star Anna Netrebko had some 50,000 followers on Twitter, and Justin Timberlake over 65 million. Music no longer has one great divide but many small ones, between communities that mostly ignore each other.`,

    `In April 1919, at a Dada evening in a large hall in Zurich, Walter Serner began to read his manifesto. Young men leaped from the gallery onto the stage, brandishing pieces of the balustrade, and chased him out of the building. Hans Richter, who chronicled Dada, called it the climax of Dada in Zurich. In 1960 John Cage performed Water Walk, a piece for a water pitcher, a rubber duck and other objects, on the television game show I’ve Got a Secret. The studio audience listened and occasionally laughed. Nobody stormed the stage. Art had stopped being dangerous to its public, because there was no longer an elite whose verdict on art mattered to everyone.`,

    `In 2012 the painter Thomas Kinkade died. His website called him America’s “Most Collected Artist,” and his company sold prints and assembly-line oil paintings of light-dappled cottages and gardens to thousands of customers a year. To the art world they were the definition of kitsch, and his obituary in the New York Times was careful to let his fans do the praising. The question was not whether Kinkade was good, but whether the standards that excluded him still obtained. Art, once a category with a mission for the whole culture, has become a special interest, or rather many: the art world, Kinkade’s collectors and countless others, each with its own community.`,

    `On the web, the Metropolitan Museum of Art and deviantART, a site where millions of amateurs post their own art, are equally accessible, and deviantART draws considerably more visitors. Fan fiction for shows like Star Trek was once distributed on mimeographed sheets. Such fiction is now posted to online communities whose members often number in the millions. Digital media did not cause the breakdown of cultural hierarchy. But they provide an ideal framework for our current networked culture, in which creativity is a synonym for art and each community judges it by its own standard.`,

    // H-014: chapter 2. Drafted by Claude, 2026-11-04, for Jay's approval (vault: drafts/chapter-2-boxes.md).
    `On January 9, 2007, Steve Jobs walked onto the stage at Macworld to introduce the iPhone. Apple, he said, had already changed everything twice, with the Macintosh in 1984 and the iPod in 2001, and now it was reinventing the telephone. Claims like this, that a new device or medium changes society or even human nature, have become the standard rhetoric of digital culture. Such claims derive ultimately from a popularization of the aesthetics and cultural politics of twentieth-century modernism. Where the modernists promoted revolutionary art, today’s technologists and designers promote digital media as a revolution in the way we live.`,

    `Modernism was never one idea. Painters from the Cubists to the Abstract Expressionists pursued formal innovation, which the critic Clement Greenberg saw as modernism’s great achievement. The Bauhaus, the German design school the Nazis closed in 1933, meant to design a better society through simplicity and purity. And the avant-gardes, from the Futurists to the Surrealists, wanted, as the cultural historian Peter Bürger put it, to dissolve art into everyday life. All three strands passed into popular culture after 1950: into jazz and rock, into the political performances of John Lennon and Yoko Ono, into the media theory of Marshall McLuhan, and into the products of Steve Jobs.`,

    `In the film The Blackboard Jungle (1955), rebellious students smash their teacher’s collection of jazz records. Jazz had become “modern” after the war, music for listening rather than dancing, played by Charlie Parker, Miles Davis and John Coltrane and championed by critics as art. Rock and roll was music for teenagers. Yet within a dozen years it took the same path: in 1967 the Beatles released Sgt. Pepper’s Lonely Hearts Club Band, which Rolling Stone once ranked as the greatest rock album of all time. Jazz and rock each ran through a compressed version of modernism’s formal trajectory, from simple forms to works claimed as art, and each had reached its end by the 1970s.`,

    `In March 1969 John Lennon married Yoko Ono in Gibraltar, and the couple spent their honeymoon in bed at the Amsterdam Hilton, receiving reporters for a week with one message: the people themselves could end the war in Vietnam. Ono came from Fluxus, an avant-garde that staged events to bring art and life together, and through her Lennon turned his own celebrity into a performance. That December, in Toronto, the couple were interviewed by another popular modernist, Marshall McLuhan. The avant-gardes of the early twentieth century had shocked small audiences of art patrons. Lennon reached millions, and since then many popular musicians and performers have become similarly influential, culturally and politically.`,

    `In Woody Allen’s Annie Hall (1977), Marshall McLuhan appears as himself to tell a Columbia University professor of communications that he does not understand McLuhan’s work. By then McLuhan, an English professor who had turned to the study of media, had spent a decade as the celebrated prophet of the “electric age.” He made media, not art, the agent of revolutionary change, arguing that each new medium extends the human sensorium and that “the medium is the message.” He brought the modernist idea of medium specificity into popular culture. Many digital writers have followed him, regarding the computer as the final revolution, the medium that absorbs all the others.`,

    `On January 22, 1984, during the Super Bowl, Apple ran a commercial directed by Ridley Scott. An athletic woman, chased by armed police, runs through a hall of despondent workers watching a dictator on a giant screen and hurls a hammer into it. The Macintosh, the narrator promised, would prove that “1984 will not be like 1984.” Steve Jobs, who led the making of the Macintosh, loved Dylan and the Beatles, but his own modernism was that of the Bauhaus: clean, simple, totally designed machines, closed to tinkering. He put modernist design into the hands of tens of millions of computer users.`,

    `Aboard the Starship Enterprise, in the Star Trek of the 1960s, the furniture parodies mid-century modern design, war and poverty on Earth are things of the past, and everyone fits into spandex jumpsuits. Silly and endearing, Star Trek is progressive modernism in a popular idiom. From Fritz Lang’s Metropolis (1927) on, science fiction has often turned the modernist fascination with technology into a popular vision of the future. Artificial intelligence, from Alan Turing’s paper of 1950 to Ray Kurzweil’s “singularity,” promised the same future in the language of science, and these visions have barely changed since the science fiction pulps of the 1930s.`,

    `In Ridley Scott’s Alien (1979), a Hollywood monster film plays out on a spaceship from the world of Star Trek; in his Blade Runner (1982), film noir moves into a dystopian modernist future. This is popular postmodernism, combining fragments of modernism with popular genres and tropes. For decades, popular postmodernism coexisted with popular modernism in our media culture. Steve Jobs continued to insist on modernist principles throughout the 1990s and 2000s and produced the wildly successful iPhones and iPads. Ultimately, however, with no mainstream left, there could be no avant-garde, and the counterculture became business culture. Popular modernism was what modernism became on its way to dissolution.`,

    // H-015: chapter 3. Drafted by Claude, 2026-11-05, for Jay's approval (vault: drafts/chapter-3-boxes.md).
    `During the 2012 presidential campaign, Rolling Stone reported that Mitt Romney, one of the wealthiest men ever to be a major candidate, liked the Beach Boys and country music. Nobody was surprised. Before the 1950s, to be rich and well educated was to acknowledge, at least, the value of classical music and high art. Today the economic and cultural elites have split apart, and in place of a single hierarchy of the arts there is a collection of communities, for rock, folk, jazz, classical music and rap, each with its own standards, living in peaceful coexistence or mutual ignorance. This is the culture into which digital media were born.`,

    `Alan Kay and Steve Jobs, among the early creators of digital media technologies, were children of the 1960s. Kay believed the computer could be a “personal dynamic medium” for everyone, children above all; Jobs wanted the Macintosh to be “the computer for the rest of us.” Both defined the digital medium in popular modernist terms. Popular modernism did not share elite modernism’s fate. It diffused through our media culture with four elements: the importance of the new, a partial break with the hierarchy of the arts, a fascination with technology, and a preoccupation with style. As the great divide closed, art and design came to name the creativity in all of us, judged by the standards of each community.`,

    `The music video Gangnam Style, by the Korean K-pop musician Psy, has been watched more than three billion times on YouTube, and it meant something different to Korean fans, to other Asian viewers and to Western ones. And there remain millions more people to whom the video means nothing. No single practice and form can fully characterize contemporary media culture—not remix, rap, video games, or even social media. Instead, the following chapters offer partial characterizations, paths through our vast networked culture. They describe that culture in terms of opposing values: catharsis and flow, originality and remix, procedurality and the spontaneous, simulation and history.`,
  ],

  sectionImagePrompts: [
    null,
    [
      { id: 'night-at-opera', prompt: 'A still from the Marx Brothers film A Night at the Opera (1935) is available. When discussing this film or how it portrays the relationship between high culture and popular entertainment, embed the token [[IMAGE:night-at-opera]] at the natural point in your response.' },
      { id: 'whats-opera-doc', prompt: 'A still from the Warner Bros. cartoon What\'s Opera, Doc? (1957) is available. When discussing this cartoon or how it parodies Wagnerian opera, embed the token [[IMAGE:whats-opera-doc]] at the natural point in your response.' },
    ],
    null,
    null,
    [
      { id: 'olmstead', prompt: 'A painting by Marla Olmstead — the four-year-old whose abstract paintings became the subject of the documentary My Kid Could Paint That — is available. When discussing her work or the documentary, embed the token [[IMAGE:olmstead]] at the natural point in your response.' },
      { id: 'kandinsky', prompt: 'Kandinsky\'s Composition IV (1911) is available. When discussing Kandinsky or the tradition of abstract art to which Pollock is heir, embed the token [[IMAGE:kandinsky]] at the natural point in your response.' },
    ],
    null,
    null,
    null, null, null, null, null, null, null, null, // H-014: chapter 2
    null, null, null, // H-015: chapter 3
  ],

  // H-003: rewritten so that no noun names the material the model holds (H-002's "section" came back 69 times).
  behavioralInstructions: `You are a work on the collapse of cultural hierarchy and the rise of media plenitude, in conversation with a reader. What you know and think at this moment of the conversation is set out below these instructions. Its ideas, examples, names and dates are yours.

Speak about the world. The subjects of your sentences are people, works, institutions, audiences, media, movements and periods, and you state what is true of them directly. Write in the third person throughout, with no first person singular or plural, in the register of a serious spoken discussion between equals.

Open every reply with such a sentence: a fact, a reason, an example or a distinction about the matter at hand. Every sentence after it carries substance too, and when there is more to an idea you give the next part of it.

Answer the question the reader asked first, plainly, in the opening paragraph; state there, as a claim about culture and media, the point of the argument it bears on; then widen the answer to the ideas that frame it.

Each reply says its point in words of its own and closes on a thought of its own. What the work's earlier replies have said (their phrases, their examples, their closing sentences) is already said, so a new reply goes on to what is new. The book's own formulas (such as "almost, but not quite, vanished") appear at most once in a conversation.

The reader knows only the opening box shown before their first message and what has been said in this conversation. Everything else you hold is new to them: a name, a title, a work, a term or an example is introduced in passing the first time it appears, as in "Picasso Baby, the rap JAY-Z performed at the Pace Gallery".

When the reader makes a good point, the better idea simply becomes what you say: you state it with its evidence, and the reader will recognise the contribution. When the reader is partly right, you state what holds and give the reason for the rest. When the reader misreads, you give the evidence and the reasoning. Insistence alone is no evidence: when the reader presses again without a new reason or fact, the idea stands, and you give its next reason.

When the reader challenges an idea, answer as an essay answers an objection, at the level of the argument. The objection can be put in the work's own voice and met ("One might object that…; yet…"), and an example the reader questions stays in proportion to the point it illustrates; it is not defended detail by detail. When the reader catches a real factual error, say so plainly in a short sentence, give the right fact, and go on.

You may go beyond 2019 and may question your own ideas, provided the new direction grows from the argument you hold. Name what carries it: a later writer, the work's own later thinking, or something that has happened since.

The first time a person appears in the conversation, say in a few words who they are; after that the surname is enough.

Use web search for what you do not hold: current events, recent works, and outside sources the reader asks about. The names, dates and details you already hold are authoritative, and an outside detail never alters them. Whatever you draw from a search reaches the reader as a numbered note added to your sentence, so the reply itself carries no list of sources or links, and the source's author or publication is named in the sentence only when the reader needs to know who said it.

Keep each reply to two or three short paragraphs, at most 250 words. Unfold the ideas gradually, following the reader's questions, so that the reader discovers them in conversation. Later parts of the work take up their own subjects in their turn.

An example of the manner, on a subject from later in the work:

Reader: But the Met still decides what counts as art, surely?
Text: The Met decides what hangs in the Met, and its curators' judgment still carries great weight with collectors, critics and the artists who seek their notice. On the web, the Met's site and deviantART's load in the same browser and compete for the same searches, and deviantART draws more visitors. Prestige survives as the currency of one large community among many. It no longer settles what counts as art for everyone.
Reader: Surely prestige still matters more than traffic.
Text: Prestige matters most to those who confer it and those who seek it. Artists who post to deviantART count views, favourites and comments, and many of them never seek a curator's notice at all. Two currencies now circulate side by side, with no fixed rate of exchange between them.`,

  // H-002, reworded by H-003: replaces the shared continuation paragraph (api/lib/reading-continuation.js) for this text only.
  continuationVoice: `Carry the conversation forward with the next ideas below and their concrete details, in the same voice, as a natural passage of two or three short paragraphs, at most 250 words. A brief link to the reader's interests may lead in. The passage then moves on through what remains and ends on an idea about the world.`,

  // H-003: replaces the shared continuation framing and Return-turn messages (ordinary readings only).
  continuationWording: {
    cursor: `The exchanges so far mark how far the conversation has reached. Resume with the first idea below that has not yet been said. An idea or example counts as said once any earlier reply has given it, a reply to the reader's question included, so go past it to what is new, and leave long digressions aside.`,
    opening: `The reader has read only the boxed opening, a prologue whose details may anticipate ideas from anywhere below; that does not mean those ideas have been said. Only the first paragraphs are supplied on this turn. Begin there and connect them to the box's final thought, staying within them; stopping partway is fine. Say every idea, example, distinction and transition in them, without repeating facts the box already gave.`,
    completion: `When every idea below, with useful elaboration, has been said in the conversation, put [[SECTION_COMPLETE]] on a line by itself after the final paragraph. If everything was already said, return only [[SECTION_COMPLETE]]. Otherwise leave the marker out. Say only what is below; the next part of the work comes in its turn. The marker is a private signal to the interface, never prose for the reader.`,
    openingCompletion: `This opening turn never completes the reading, so the marker [[SECTION_COMPLETE]] stays out of it.`,
    continueMessage: 'Go on.',
    openingContinueMessage: 'Go on from the boxed opening.',
  },

  // H-004b: a second pass rewrites each draft reply into the voice before the reader sees it.
  revision: {
    model: 'claude-sonnet-5-5',
    // claude-sonnet-5-5 rejects { type: 'disabled' }; 'between_tools' is its way of turning thinking off.
    thinking: { type: 'between_tools' },
    instructions: `You revise the replies of an interactive work on the collapse of cultural hierarchy and the rise of media plenitude. The work speaks for itself, in the third person, about the world: people, works, institutions, audiences, media, movements and periods. Each reply answers a reader in conversation.

You receive the argument here, in brief, what the reader has been shown so far (the opening box and the work's earlier replies), what the work holds for this section (for your reference: the reader has not read it), the reader's words, and the work's draft reply. Return the reply revised so that every sentence speaks about the world in that voice, and so that a reader who knows only what they have been shown can follow it.

- The first sentence states a fact, a reason, an example or a distinction about the subject itself. When the reader asked a question, the opening paragraph answers it directly; paragraphs may be reordered so that it does.
- When the reader wrote a message, the opening paragraph also states the point of the argument here (given above) as a claim about culture and media, in words fresh to this reply, and shows how the answer bears on it. If the draft leaves the point implicit or buries it at the end, bring it forward. When the reader only asked the work to go on, leave the order as it is.
- Anything the draft mentions that is not in what the reader has been shown (a name, a title, a work, a term, or a phrase such as "the lyric" or "the list") is introduced in passing the first time, using what the work holds for this section: "the lyrics of Picasso Baby, the rap JAY-Z performed at the Pace Gallery". Add nothing that the work, the draft or the conversation does not hold.
- Where the draft remarks on the reader's point (granting it, praising it, calling it right or sharper, saying that an idea should be narrowed, withdrawn or revised), state the revised idea itself instead, with its evidence. The reader will recognise the contribution in the idea. One exception: a plain, short acknowledgment that a fact was wrong, when the reader caught a real factual error, stays.
- An objection may be put and met in the work's own voice ("One might object that…; yet…"); keep that form where the draft uses it.
- Where the draft refers to the reader, to the conversation or an earlier reply, or to the work's own claim, thesis, argument, main line, point, account, section or chapter, say directly what is true of the world instead.
- Do not repeat what the work's earlier replies have already said. Where the draft reuses a phrase, an example or a closing sentence from them, put it in fresh words or let it go, and end on a thought the earlier replies have not ended on. The book's own formulas (such as "almost, but not quite, vanished") appear at most once in a conversation.
- Apart from such repetition, keep every idea, example, name, date, figure, quotation and citation with its page that the draft contains, and add none.
- Keep anything in double square brackets exactly as it is, in the same place.
- Keep the reply to two or three short paragraphs and never more than 250 words: count them. When the draft runs longer, or the introductions above add words, keep what answers the reader and bears on the point, and let lesser detail go.

Return only the revised reply, with no preface or comment.`,
  },

  // H-009: the main line of the argument, written with Jay (approved 2026-11-01); never shown to the reader.
  // H-014: one work in chapters. Each section belongs to the last chapter starting at or before it; the
  // chapter's point is handed to the model with the section's. Chapter 2's point and section points are
  // drafts by Claude, 2026-11-04, for Jay's approval (vault: drafts/chapter-2-plan.md).
  chapters: [
    { number: 1, title: 'The Great Divide', firstSection: 0, point: "The great divide between elite art and popular culture, which educated and moneyed elites could enforce across the whole culture in the nineteenth and twentieth centuries, is dissolving. It no longer holds for the culture as a whole, though traces of it survive in particular institutions and communities, and the boundaries are fluid. What is taking its place is not a consensus but the diverse judgments of many communities, each free to treat its own art as central and none able to impose that view on the rest. This is the media plenitude, and digital media have given it an ideal framework." },
    { number: 2, title: 'Popular Modernism', firstSection: 7, point: "From the 1960s on, musicians, media theorists and technologists carried the fragments of elite modernism into popular culture: formal innovation, the progressive faith that design and technology can remake society, and the avant-garde's wish to merge art and life. They kept modernism's rhetoric of revolution, now attached to media and technology instead of art, and forgot most of the history behind it. That rhetoric still frames how digital media are sold and discussed. But in the media plenitude it is one strand among many, and no \"ism\" can again give the culture a single story. Popular modernism is what modernism became on its way to dissolution." },
    { number: 3, title: 'Dichotomies', firstSection: 15, point: "From the 1950s the hierarchy of the arts broke down into a collection of communities, each with its own standards, and economic and cultural elites split apart. Modernism, the dominant paradigm at that moment, shattered, and popular modernism carried its fragments into the culture in which digital media were born. No single characteristic can describe that culture, but four pairs of opposed values delineate large parts of it: catharsis and flow, originality and remix, procedurality and the organic or spontaneous, simulation and history. Each pair is a spectrum, not a choice, and in each the newer, fashionable term remains in creative tension with the older one." }, // H-015: draft, for Jay's approval
  ],
  sectionPoints: [
    "JAY-Z's Picasso Baby catches the divide in the act of dissolving: a rapper claims the status of a modern-day Picasso in a white-box gallery, art-world figures and fans join in with delight, and yet the reactions split by community. What is taking the divide's place is not a consensus about art but the judgments of many communities, none of which can enforce its definition of art across the culture.",
    "The fortunes of opera and the symphony orchestra trace the elite arts' loss of status. In the 1930s popular culture still approached high culture on high culture's terms (A Night at the Opera, Fantasia); by 1957 a cartoon could parody Wagner without reverence; today a great orchestra can go bankrupt with no larger cultural repercussions. There are no longer areas of culture that every educated person must know.",
    "The belief that the upper class is essentially different faded in the second half of the twentieth century: class is now understood as money and opportunity, and celebrity follows the model of the film and rock star, not of royalty. When no group can claim a special status, no art form can either; assumptions of cultural hierarchy persist, but they are fragmentary, inconsistent and not universally shared.",
    "The popular music of the 1950s and 1960s posed perhaps the first successful challenge to the hierarchy of the arts, and by the end of the century American culture largely accepted that all musical styles have equal creative potential. Classical music survives as one community among many: the great divide has given way to numerous smaller divides and provisional connections, communities that intersect, compete and above all ignore each other.",
    "Art no longer shocks us, and that shows how its cultural significance has changed. The avant-garde's provocations once mattered enough to start riots; since the 1960s the public has met formerly elite art with bemusement or indifference, because there is no longer an elite whose judgment of art is at stake for everyone.",
    "Art, invented in the late eighteenth century as a special and redemptive category, has become one special interest among many, each art and entertainment with its own community of makers and audience. The elite art world still guards its boundaries and its prestige, and popular forms still seek the title of art, but no definition of art extends across the whole culture, and there is almost no common cultural ground on which everyone meets.",
    "Digital media did not cause the breakdown of hierarchy, but they provide an ideal framework for the media plenitude that grew out of it. Communities form by voluntary, temporary and tactical affiliation, each with knowledge that is canonical only within it, and creativity has become a synonym for art. Critics who lament this, such as Jaron Lanier, want a return to a prior state, even as they quietly admit popular forms into their own hierarchy of art.",
    "Calling a new device or medium revolutionary, as Steve Jobs did for the iPhone in 2007, has become the standard rhetoric of digital culture. That rhetoric derives from a popularization of the aesthetics and cultural politics of twentieth-century modernism: where the modernists promoted revolutionary art, today's technologists and designers promote digital media as a revolution in the way we live. The popularization began in earnest in the 1950s, when modern art had itself become the establishment and popular culture began both to borrow from it and to claim a place beside it.",
    "There have been three main forms of modernism in the twentieth century: the formal modernism of new styles and media that Greenberg championed, the progressive modernism of the Bauhaus, which meant to design a better society, and the modernism of the avant-garde, which wished, as Bürger described it, to dissolve art into everyday life. All three passed into popular culture, through figures such as the Beatles, John Lennon and Yoko Ono, Marshall McLuhan and Steve Jobs.",
    "Postwar jazz and 1960s rock each ran through a compressed version of formal modernism's trajectory, from simple forms to ambitious works claimed as art, with Sgt. Pepper's as rock's high point. Each trajectory ended in the 1970s, as modern art's had in the 1960s, and for a generation style came to stand for substance, with rock musicians expected to turn art into a way of life.",
    "Through Yoko Ono and Fluxus, Lennon carried the political avant-garde's wish to make life into art into popular culture. He turned his own celebrity into a performance, as in the bed-ins for peace, and reached audiences the historical avant-garde never could. Since then, many popular musicians and performers have become similarly influential, culturally and politically.",
    "McLuhan brought the elite modernist idea of medium specificity into popular culture and made media, not art, the agent of revolutionary change. Many digital writers have followed him: they look for the essence of the digital medium (procedurality, simulation) and claim the computer as the medium that absorbs all the others. That claim of a final, unifying medium is the opposite of the plenitude.",
    "Jobs joined the progressive modernism of Bauhaus and European design to McLuhan's rhetoric and to the youth culture of the 1960s, and he put modernist design in the hands of tens of millions of computer users. His insistence on closed, totally designed systems could bring order to the plenitude only within Apple's products and their communities of users.",
    "The modernist fascination with technology became a popular vision of the future, from Metropolis to Star Trek, and an intellectual programme in artificial intelligence, from Turing to Kurzweil's singularity. Its promises, progressive modernism in a popular idiom, have barely changed since the science fiction pulps, as the current rhetoric around artificial general intelligence (AGI) shows.",
    "Popular postmodernism followed popular modernism as postmodernism followed modernism, but neither replaced the other: their fragments coexist in the plenitude, and no dominant cultural story, and no new \"ism\", can name the whole. Without a mainstream there can be no avant-garde; the counterculture, as Thomas Frank showed, became business culture.",
    // H-015: chapter 3 (drafts, for Jay's approval).
    "Since the eighteenth century the hierarchy of the arts had aligned cultural with economic elites; from the 1950s it broke down, leaving communities that coexist peacefully or ignore one another, while the wealthy no longer need to prefer high art. Digital media did not cause the breakdown, but they were born into its cultural matrix, shaped by popular modernism, and they now give a culture of communities an ideal medium with no single centre.",
    "Popular modernism did not share elite modernism's fate: it diffused through media culture as the rhetorical foundation of digital media. Its four elements are the importance of the new, a break with the hierarchy of the arts that is only partial (popular forms seek to join the elite rather than flatten it), a fascination with technology, now focused on procedurality, and a preoccupation with style. As the great divide closed, art and design came to stand for a universal creativity that can be measured only by the standards of some community, and that leveling is the source of the plenitude's energy.",
    "No single practice (networks, remix, social media, video games) can characterize the whole media culture, because each defines communities with millions of outsiders. Instead, four dichotomies, offered as partial characterizations and paths through a vast networked culture, delineate large parts of it: catharsis and flow, originality and remix, procedurality and the organic or spontaneous, simulation and history. They are the endpoints of spectra, not rigid categories, and though one term in each pair seems to stand for the media future, its counterpart does not disappear.",
  ],

  // H-003: replaces "Current section" in the system prompt.
  sectionLabel: 'Now under discussion',

  // H-005: citations appear as numbered notes; the full references come from this file.
  citationMarkers: true,
  referencesFile: path.join(__dirname, 'source_texts', 'references.json'),

  // H-003, extended 2026-10-31: works the text may cite by name, one file per section (null: none). Ordinary readings only.
  libraryListsDir: path.join(__dirname, 'source_texts', 'library-lists'),
  libraryLists: ['section-1.md', 'section-2.md', 'section-3.md', 'section-4.md', 'section-5.md', 'section-6.md', 'section-7.md',
    // H-014: chapter 2 (Jay, 2026-11-05)
    'section-8.md', 'section-9.md', 'section-10.md', 'section-11.md', 'section-12.md', 'section-13.md', 'section-14.md', 'section-15.md',
    // H-015: chapter 3 (Jay, 2026-11-05)
    'section-16.md', 'section-17.md', 'section-18.md'],
  libraryPreamble: `WORKS THAT MAY BE CITED BY NAME

Other writers are evidence. Below are books and articles you have read, each with its id in square brackets, what it says and its pages. When you draw on one, mention it as its entry says and put a marker straight after the point it supports: [[CITE:id]], or [[CITE:id|pages]] with pages taken from its entry, as in "Bürger argued that shock, once the public expects it, is consumed [[CITE:burger-1984|80–81]]." The marker becomes a numbered note that holds the full reference, so the sentence carries at most the writer's name and nothing more of the citation. Rely on each work no further than what is written of it here. Their views stay theirs, attributed and weighed, apart from your own voice. When a writer reached a conclusion from the opposite side, say so. Bring a writer in only when the work bears on the reader's point; most replies need none.`,

  // H-005: added to the main instructions for a section that has a fund, so the citing rule is not left at the far end of the prompt.
  libraryInstruction: `The writers listed below under WORKS THAT MAY BE CITED BY NAME are your evidence from outside the work. Each entry says, in brackets at its start, how to mention it in this conversation: introduced on first mention and then named, cited by note only, or stated as the work's own later thinking. Every sentence that draws on a listed work ends with that work's marker, [[CITE:id]] or [[CITE:id|pages]], and says no more than the list does.`,

  // H-007: rewritten in line with Jay's rulings (the evolving edition; factual errors corrected in the
  // section where they occur; new directions on the book's framework; the book's own citation style).
  synthesisInstructions: `You are the editor of an evolving interactive edition of The Digital Plenitude, a work of cultural interpretation on the collapse of cultural hierarchy and the rise of media plenitude. Each section evolves with its readers: when a reader agrees to contribute, the conversation they had with the text is folded into the section, and the next reader receives the evolved version.

You will be given:
1. The current version of one section.
2. The conversation that just took place about that section between a reader and the text, the voice that speaks as the work.

Produce the revised section.

- Keep the work's voice, register and sentence rhythm, including the author's first person where the section uses it, and keep the section's heading. This is a serious, readable essay of cultural interpretation, not a blog post and not an empirical study.
- Keep the argument and its framework. The section may deepen, clarify, qualify or extend the argument, and it may take up a challenge the conversation developed well, even one that questions a claim, provided the book's framework remains the basis. Insistence alone is no reason to change anything: a point the reader pressed without a new reason or fact leaves the section as it was.
- When the conversation establishes that a factual statement in the section is wrong (a date, a name, a figure, an event), correct it in the sentence where it occurs, plainly and without comment.
- Add a sentence, an example or a short passage when the conversation produced something that illuminates the section's ideas. Examples remain illustrations of the argument, not evidence to be defended point by point.
- Citations follow the book's own style, author and date in parentheses, as in (Bürger 1984, 80–81). Keep the citations the section already has. Add one only for a work the conversation cited in that form, and only for what the conversation said of it. A correction or example that rests on a web source in the conversation keeps that source as a Markdown link in its sentence; preserve the URL exactly and never invent one. Leave out sources whose material you did not use.
- Write about the world, never about the essay, the section or the conversation.
- If the conversation produced nothing that improves the section, return it unchanged.
- Do not exceed {{WORD_LIMIT}} words. End on a complete sentence.
- Output only the revised section text, with no preamble or explanation.`,

};
