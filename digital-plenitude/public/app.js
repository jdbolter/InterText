const conv = document.getElementById('conversation');
const input = document.getElementById('message-input');
const goBtn = document.getElementById('go-btn');
const finishBtn = document.getElementById('finish-btn');
const runningPosition = document.getElementById('running-position');

let history = [];
let sectionIndex = 0;
let shownImages = new Set();
let shownMedia = new Set(); // H-018
let saveConsent = false;
// Which text this session reads when not contributing: the collectively-evolved
// edition as it stands today, or the untouched original. Contributing always means
// reading (and building on) the evolving edition.
let readingEdition = 'evolving';
let sectionHistoryStart = 0;
const contributionHistory = [];
const sectionHistories = new Map();
const sectionSummaries = new Map();
const editorialVersionIds = new Map();
const presentedFundEntryIds = new Map();
const contributionSessionId = `intertext-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const completedSections = new Set();
const visitedSections = new Set();
let sending = false;
let endShown = false;
const CONTINUE_MESSAGE = 'Continue reading from where we have reached in this section.';

// H-014: one work in chapters; numerals start again in each chapter.
const SECTION_NUMERALS = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII',
  'I', 'II', 'III',
  'I', 'II', 'III', 'IV', 'V',
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'I', 'II', 'III', 'IV', 'V',
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII',
  'I',
];

// H-014: must match config.chapters (number, title, firstSection); a test checks this.
const CHAPTERS = [
  { number: 1, title: 'The Great Divide', firstSection: 0 },
  { number: 2, title: 'Popular Modernism', firstSection: 7 },
  { number: 3, title: 'Dichotomies', firstSection: 15 },
  { number: 4, title: 'Catharsis', firstSection: 18 },
  { number: 5, title: 'Flow', firstSection: 23 },
  { number: 6, title: 'Remix and Originality', firstSection: 29 },
  { number: 7, title: 'Procedurality, History, and Simulation', firstSection: 34 },
  { number: 8, title: 'Social Media and the Politics of Flow', firstSection: 40 },
  { number: 9, title: 'Conclusion', firstSection: 48, label: 'Conclusion' },
];

// A chapter with a label (the Conclusion) is headed by the label alone.
function chapterHeading(chapter) {
  return chapter.label || `Chapter ${chapter.number}: ${chapter.title}`;
}

function chapterOf(idx) {
  let found = CHAPTERS[0];
  CHAPTERS.forEach(chapter => { if (chapter.firstSection <= idx) found = chapter; });
  return found;
}

const SECTION_TITLES = [
  'The Great Divide',
  'The Philadelphia (Orchestra) Story',
  'Class in America',
  'The Case of Music',
  'Shocking Art',
  'Art as a Special Interest',
  'Communities & Creativity',
  'Popular Modernism',
  'Popular Modernism: Formal, Progressive and Avant-Garde',
  'Popular Music and Formal Modernism',
  'John Lennon and Yoko Ono as Political Modernists',
  'McLuhan and Popular Modernism',
  'Steve Jobs',
  'The Future as Popular Modernist Kitsch',
  'Forgetting (Popular) Modernism',
  'Dichotomies',
  'The Rise of Popular Modernism',
  'Describing the Plenitude',
  'Catharsis',
  'Fragmented Stories',
  'The Cinema of Immersion',
  'Catharsis in Video Games',
  'The Past and Future of Catharsis',
  'From Catharsis to Flow',
  'Games and Flow',
  'Flow Culture',
  'Our Time Traveler',
  'The Spectrum of Catharsis and Flow',
  'The Popular Avant-Garde',
  "Remix and Originality",
  "Remix Culture",
  "Good Musicians Copy; Great Musicians Remix",
  "Remix and Modernism",
  "Playing in the Plenitude",
  "Datafication",
  "The Procedural and the Mechanical",
  "Video Games: Procedures to Save the World",
  "History and Simulation",
  "Strong and Weak Narratives",
  "The Procedural Divide",
  "Social Media and the Politics of Flow",
  "Flow and the Not So New Narcissism",
  "The Performance of Identity",
  "Social Media and Weak Stories",
  "Digital Identity and Identity Politics",
  "Social Media and Collective Action",
  "Anonymous",
  "Weak Narrative and American Politics",
  "Conclusion",
];

function priorSectionSummaries(activeSection) {
  return Array.from(sectionSummaries.entries())
    .filter(([section]) => section !== activeSection)
    .sort(([a], [b]) => a - b)
    .map(([section, summary]) => ({
      sectionIndex: section,
      title: SECTION_TITLES[section],
      summary,
    }));
}

// Image filenames: drop files in digital-plenitude/images/ matching these names.
// Section 2: night-at-opera.png, whats-opera-doc.png
// Section 5: olmstead.png, kandinsky.jpg
const SECTION_IMAGES = [
  null,
  [
    { id: 'night-at-opera', src: '../images/night-at-opera.png', alt: 'A Night at the Opera, Marx Brothers (1935)' },
    { id: 'whats-opera-doc', src: '../images/whats-opera-doc.png', alt: "What's Opera, Doc? (1957)" },
  ],
  null,
  null,
  [
    { id: 'olmstead', src: '../images/olmstead.png', alt: 'Painting by Marla Olmstead, subject of My Kid Could Paint That (2007)' },
    { id: 'kandinsky', src: '../images/kandinsky.jpg', alt: 'Wassily Kandinsky, Composition IV (1911)' },
  ],
  null,
  null,
  null, null, null, // H-014: chapter 2
  // H-017: section 11, the book's figure 2.1 (CC BY-SA 3.0 NL, credited under the picture).
  [
    { id: 'lennon-ono-bed-in', src: '../images/fig-2-1-lennon-ono-bed-in.jpg', alt: 'John Lennon and Yoko Ono in bed at the Amsterdam Hilton, 1969, under hand-lettered signs reading HAIR PEACE and BED PEACE', credit: 'John Lennon and Yoko Ono, “Bed-in for Peace,” Amsterdam Hilton, 1969. Photograph: Nationaal Archief (National Archive of the Netherlands), CC BY-SA 3.0 NL.', creditUrl: 'https://creativecommons.org/licenses/by-sa/3.0/nl/deed.en' },
  ],
  null, null, null, null,
  null, null,
  // H-017: the diagram of the four spectrums, shown at full width.
  [
    { id: 'spectrums', src: '../images/spectrums.svg', alt: 'Four spectrums in contemporary media culture: catharsis and flow, originality and remix, the organic or spontaneous and procedurality or datafication, history and simulation, with tradition on one side and the media future on the other', figure: true },
  ],
  null, null, null, null, null, // chapter 4
  null, null, null, null, // chapter 5: sections 24 to 27
  // Jay's diagrams 5.2 and 5.5, shown at full width.
  [
    { id: 'flow-and-catharsis', src: '../images/fig-5-2-flow-and-catharsis.png', alt: "A scale from catharsis to flow, with Titanic, Casablanca, Downton Abbey and The West Wing near catharsis; The Matrix, Skyfall, Edge of Tomorrow and Lost toward the middle; second-screen television and YouTube at the middle; Gone Home, Edith Finch and I Love Bees beyond; and Facebook, Music for Airports, Lose Yourself, Twitter and Bejeweled toward flow", figure: true },
  ],
  [
    { id: 'three-aesthetics', src: '../images/fig-5-5-three-aesthetics.png', alt: "A triangle with catharsis, flow and reflection at its corners: Titanic and Casablanca near catharsis; Bejeweled and Music for Airports near flow; Un Chien Andalou, Ulysses, Untitled-Game and Super Mario Clouds toward reflection; Mother Courage, Passage, Scary Movie, Toy Story, Lost, The Matrix and Edith Finch in the interior", figure: true },
  ],
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, // chapters 6 to 8 and the Conclusion: sections 30 to 48
  // Jay's diagram 9.1, shown at full width.
  [
    { id: 'dichotomies', src: '../images/fig-9-1-dichotomies.png', alt: "Four dichotomies of our media culture, the traditional term on the left and the newer on the right: catharsis and flow; originality and remix; the organic or spontaneous and procedurality or datafication; history and simulation", figure: true },
  ],
];

// Flat lookup map for inline image tokens
const IMAGE_MAP = {};
SECTION_IMAGES.forEach(section => {
  if (section) section.forEach(img => { IMAGE_MAP[img.id] = img; });
});

const SECTION_INTROS = [
  `<p>In 2013 JAY-Z released &ldquo;Picasso Baby,&rdquo; a song and a video: the rapper wants to own a Picasso and ends by claiming to be a new Picasso. He is performing in New York&rsquo;s Pace Gallery, one of the city&rsquo;s prestigious art spaces. Art-world figures and fans take turns standing across from him while he raps. Marina Abramović, whose MoMA performance of 2010 he was borrowing (she sat motionless for more than two months, staring at one stranger after another), appears as one of his partners. Everyone in the film is delighted that the art world has accepted the rapper as an artist. The great divide between elite art and popular culture is in the process of dissolving.</p>`,

  `<p>In 1940 Leopold Stokowski, the flamboyant conductor who had led the Philadelphia Orchestra for more than two decades, appeared in Disney&rsquo;s <em>Fantasia</em> as a silhouette, and Mickey Mouse treated him with nervous reverence. Even that was too much for one newspaper columnist, who called the film a symptom of &ldquo;the collapse of the civilized world.&rdquo; Seventeen years later, in the cartoon <em>What&rsquo;s Opera, Doc?</em>, Bugs Bunny played Brünnhilde to Elmer Fudd&rsquo;s Siegfried, with no reverence at all. In April 2011 the Philadelphia Orchestra filed for bankruptcy, the first of America&rsquo;s &ldquo;Big Five&rdquo; orchestras to do so. Opera and the symphony have lost their claim to cultural preeminence: there is in fact no longer <em>any</em> music that every educated person is expected to know.</p>`,

  `<p>In 1926 F. Scott Fitzgerald wrote that the very rich are different from you and me. Twelve years later Ernest Hemingway borrowed the line and added: yes, they have more money. American culture has come round to Hemingway. The society column, still a fixture of the newspaper in 1940, when <em>The Philadelphia Story</em> put Main Line high society on the screen, is now an amusing relic. A &ldquo;socialite&rdquo; like Paris Hilton became famous for being famous, and royalty borrow their celebrity from rock and movie stars, not the reverse. Once no class could claim to be essentially different, no art could claim to be essentially higher. The old hierarchy of taste survives only in fragments, and not everyone shares them.</p>`,

  `<p>When the rock and roll pioneer Chuck Berry sang &ldquo;Roll Over Beethoven,&rdquo; he meant no hostility. He and his young audience did not know or care about the classical tradition, and Beethoven was simply the name for the music his own was replacing. By the end of the century, American culture had largely accepted that rock, country, hip-hop and symphonic music all have equal creative potential. Wikipedia lists well over a hundred genres of rock alone. In 2018 the opera star Anna Netrebko had some 50,000 followers on Twitter, and Justin Timberlake over 65 million. Music no longer has one great divide but many small ones, between communities that mostly ignore each other.</p>`,

  `<p>In April 1919, at a Dada evening in a large hall in Zurich, Walter Serner began to read his manifesto. Young men leaped from the gallery onto the stage, brandishing pieces of the balustrade, and chased him out of the building. Hans Richter, who chronicled Dada, called it the climax of Dada in Zurich. In 1960 John Cage performed <em>Water Walk</em>, a piece for a water pitcher, a rubber duck and other objects, on the television game show <em>I&rsquo;ve Got a Secret</em>. The studio audience listened and occasionally laughed. Nobody stormed the stage. Art had stopped being dangerous to its public, because there was no longer an elite whose verdict on art mattered to everyone.</p>`,

  `<p>In 2012 the painter Thomas Kinkade died. His website called him America&rsquo;s &ldquo;Most Collected Artist,&rdquo; and his company sold prints and assembly-line oil paintings of light-dappled cottages and gardens to thousands of customers a year. To the art world they were the definition of kitsch, and his obituary in the <em>New York Times</em> was careful to let his fans do the praising. The question was not whether Kinkade was good, but whether the standards that excluded him still obtained. Art, once a category with a mission for the whole culture, has become a special interest, or rather many: the art world, Kinkade&rsquo;s collectors and countless others, each with its own community.</p>`,

  `<p>On the web, the Metropolitan Museum of Art and deviantART, a site where millions of amateurs post their own art, are equally accessible, and deviantART draws considerably more visitors. Fan fiction for shows like <em>Star Trek</em> was once distributed on mimeographed sheets. Such fiction is now posted to online communities whose members often number in the millions. Digital media did not cause the breakdown of cultural hierarchy. But they provide an ideal framework for our current networked culture, in which creativity is a synonym for art and each community judges it by its own standard.</p>`,

  // H-014: chapter 2 (drafts for Jay's approval).
  `<p>On January 9, 2007, Steve Jobs walked onto the stage at Macworld to introduce the iPhone. Apple, he said, had already changed everything twice, with the Macintosh in 1984 and the iPod in 2001, and now it was reinventing the telephone. Claims like this, that a new device or medium changes society or even human nature, have become the standard rhetoric of digital culture. Such claims derive ultimately from a popularization of the aesthetics and cultural politics of twentieth-century modernism. Where the modernists promoted revolutionary art, today&rsquo;s technologists and designers promote digital media as a revolution in the way we live.</p>`,

  `<p>Modernism was never one idea. Painters from the Cubists to the Abstract Expressionists pursued formal innovation, which the critic Clement Greenberg saw as modernism&rsquo;s great achievement. The Bauhaus, the German design school the Nazis closed in 1933, meant to design a better society through simplicity and purity. And the avant-gardes, from the Futurists to the Surrealists, wanted, as the cultural historian Peter Bürger put it, to dissolve art into everyday life. All three strands passed into popular culture after 1950: into jazz and rock, into the political performances of John Lennon and Yoko Ono, into the media theory of Marshall McLuhan, and into the products of Steve Jobs.</p>`,

  `<p>In the film <em>The Blackboard Jungle</em> (1955), rebellious students smash their teacher&rsquo;s collection of jazz records. Jazz had become &ldquo;modern&rdquo; after the war, music for listening rather than dancing, played by Charlie Parker, Miles Davis and John Coltrane and championed by critics as art. Rock and roll was music for teenagers. Yet within a dozen years it took the same path: in 1967 the Beatles released <em>Sgt. Pepper&rsquo;s Lonely Hearts Club Band</em>, which <em>Rolling Stone</em> once ranked as the greatest rock album of all time. Jazz and rock each ran through a compressed version of modernism&rsquo;s formal trajectory, from simple forms to works claimed as art, and each had reached its end by the 1970s.</p>`,

  `<p>In March 1969 John Lennon married Yoko Ono in Gibraltar, and the couple spent their honeymoon in bed at the Amsterdam Hilton, receiving reporters for a week with one message: the people themselves could end the war in Vietnam. Ono came from Fluxus, an avant-garde that staged events to bring art and life together, and through her Lennon turned his own celebrity into a performance. That December, in Toronto, the couple were interviewed by another popular modernist, Marshall McLuhan. The avant-gardes of the early twentieth century had shocked small audiences of art patrons. Lennon reached millions, and since then many popular musicians and performers have become similarly influential, culturally and politically.</p>`,

  `<p>In Woody Allen&rsquo;s <em>Annie Hall</em> (1977), Marshall McLuhan appears as himself to tell a Columbia University professor of communications that he does not understand McLuhan&rsquo;s work. By then McLuhan, an English professor who had turned to the study of media, had spent a decade as the celebrated prophet of the &ldquo;electric age.&rdquo; He made media, not art, the agent of revolutionary change, arguing that each new medium extends the human sensorium and that &ldquo;the medium is the message.&rdquo; He brought the modernist idea of medium specificity into popular culture. Many digital writers have followed him, regarding the computer as the final revolution, the medium that absorbs all the others.</p>`,

  `<p>On January 22, 1984, during the Super Bowl, Apple ran a commercial directed by Ridley Scott. An athletic woman, chased by armed police, runs through a hall of despondent workers watching a dictator on a giant screen and hurls a hammer into it. The Macintosh, the narrator promised, would prove that &ldquo;1984 will not be like <em>1984</em>.&rdquo; Steve Jobs, who led the making of the Macintosh, loved Dylan and the Beatles, but his own modernism was that of the Bauhaus: clean, simple, totally designed machines, closed to tinkering. He put modernist design into the hands of tens of millions of computer users.</p>`,

  `<p>Aboard the Starship <em>Enterprise</em>, in the <em>Star Trek</em> of the 1960s, the furniture parodies mid-century modern design, war and poverty on Earth are things of the past, and everyone fits into spandex jumpsuits. Silly and endearing, <em>Star Trek</em> is progressive modernism in a popular idiom. From Fritz Lang&rsquo;s <em>Metropolis</em> (1927) on, science fiction has often turned the modernist fascination with technology into a popular vision of the future. Artificial intelligence, from Alan Turing&rsquo;s paper of 1950 to Ray Kurzweil&rsquo;s &ldquo;singularity,&rdquo; promised the same future in the language of science, and these visions have barely changed since the science fiction pulps of the 1930s.</p>`,

  `<p>In Ridley Scott&rsquo;s <em>Alien</em> (1979), a Hollywood monster film plays out on a spaceship from the world of <em>Star Trek</em>; in his <em>Blade Runner</em> (1982), film noir moves into a dystopian modernist future. This is popular postmodernism, combining fragments of modernism with popular genres and tropes. For decades, popular postmodernism coexisted with popular modernism in our media culture. Steve Jobs continued to insist on modernist principles throughout the 1990s and 2000s and produced the wildly successful iPhones and iPads. Ultimately, however, with no mainstream left, there could be no avant-garde, and the counterculture became business culture. Popular modernism was what modernism became on its way to dissolution.</p>`,

  // H-015: chapter 3 (drafts for Jay's approval).
  `<p>During the 2012 presidential campaign, <em>Rolling Stone</em> reported that Mitt Romney, one of the wealthiest men ever to be a major candidate, liked the Beach Boys and country music. Nobody was surprised. Before the 1950s, to be rich and well educated was to acknowledge, at least, the value of classical music and high art. Today the economic and cultural elites have split apart, and in place of a single hierarchy of the arts there is a collection of communities, for rock, folk, jazz, classical music and rap, each with its own standards, living in peaceful coexistence or mutual ignorance. This is the culture into which digital media were born.</p>`,

  `<p>Alan Kay and Steve Jobs, among the early creators of digital media technologies, were children of the 1960s. Kay believed the computer could be a &ldquo;personal dynamic medium&rdquo; for everyone, children above all; Jobs wanted the Macintosh to be &ldquo;the computer for the rest of us.&rdquo; Both defined the digital medium in popular modernist terms. Popular modernism did not share elite modernism&rsquo;s fate. It diffused through our media culture with four elements: the importance of the new, a partial break with the hierarchy of the arts, a fascination with technology, and a preoccupation with style. As the great divide closed, art and design came to name the creativity in all of us, judged by the standards of each community.</p>`,

  `<p>The music video <em>Gangnam Style</em>, by the Korean K-pop musician Psy, has been watched more than three billion times on YouTube, and it meant something different to Korean fans, to other Asian viewers and to Western ones. And there remain millions more people to whom the video means nothing. No single practice and form can fully characterize contemporary media culture&mdash;not remix, rap, video games, or even social media. Instead, the following chapters offer partial characterizations, paths through our vast networked culture. They describe that culture in terms of opposing values: catharsis and flow, originality and remix, procedurality and the spontaneous, simulation and history.</p>`,

  // Chapter 4 (drafts for Jay's approval).
  `<p>It is often said that we are living in a second Golden Age of Television. <em>Mad Men</em>, <em>The Crown</em>, <em>Game of Thrones</em> and <em>Succession</em> tell long stories about characters their viewers come to care about, and David Carr, the <em>New York Times</em>&rsquo; media columnist, wrote that such shows had become &ldquo;much more like books.&rdquo; Their aesthetic is the one that has dominated popular narrative for two centuries: catharsis, an aesthetic of tension and resolution, which tells a story of conflict that leads us to identify with the characters and feel an emotional release in the end. It shaped the Victorian novel and Hollywood film. But catharsis is not universal, and the avant-garde, from Brecht on, rejected it.</p>`,

  `<p>In <em>Skyfall</em> (2012), James Bond drives his old 1960s Aston Martin home to the family estate in Scotland, loses M, his boss and mentor, and the series resets itself, all in two hours, between chases, fights and betrayals. Cathartic storytelling now comes in many styles, some traditional, some fragmentary, some a mix of catharsis and flow: moments of identification sewn into a remix of genres, stories scattered across media in alternate reality games, nested story arcs in transmedia franchises from <em>The Matrix</em> to Marvel, and the long, tangled ending of <em>Lost</em>. Character remains at the center even when realism does not.</p>`,

  `<p>In November 2015 the <em>New York Times</em> gave a million of its subscribers a strange piece of cardboard: a Google Cardboard viewer for watching 360-degree video on a smartphone. VR video, often called Cinematic VR, is the digital form closest to film. In his 2015 TED talk, the filmmaker Chris Milk called VR &ldquo;the ultimate empathy machine,&rdquo; a medium that can move its viewers to sympathy and identification as no other can. His is a classic claim of remediation: that VR does better what film always meant to do. But Cinematic VR is at least as much film as VR. It offers no interaction beyond looking around, and the viewer remains a viewer.</p>`,

  `<p>In <em>Gone Home</em> (2013) you return to your family&rsquo;s house in Oregon and find it empty. There is nothing to kill and no points to win: you read notes and listen to a journal until you understand that your sister has left home to live with the girl she loves. Some video games strive for catharsis: independent games like <em>Gone Home</em> and <em>What Remains of Edith Finch</em>, and mainstream ones like <em>The Last of Us</em>, later made into an HBO series. Their power to move the player comes from techniques borrowed from film and television, and the interaction has little to do with the emotion. Cathartic games remain a limited genre within the plenitude of video games.</p>`,

  `<p>&ldquo;We&rsquo;ll always have Paris,&rdquo; Bogart tells Bergman at the end of <em>Casablanca</em>. Hollywood drama has long looked back, and the second Golden Age of Television has made nostalgia a defining motif, from <em>Mad Men</em> to <em>The Crown</em>. Psychologists and philosophers from Jerome Bruner to Steven Pinker treat this kind of storytelling as a human universal. It is not: it was perfected in the novels, plays and films of the past two centuries, and it is not what Aristotle meant when he first applied the term to Greek tragedy. Catharsis is a modern aesthetic. It can still reach younger audiences, as the Harry Potter franchise showed, but its audience is aging, and an alternative has been gaining in status through video games.</p>`,

  // Chapter 5 (drafts for Jay's approval).
  `<p>When <em>Edge of Tomorrow</em> came out in 2014, <em>Wired</em> called it &ldquo;the best videogame you can&rsquo;t play.&rdquo; Its hero, Bill Cage, dies in combat with aliens and wakes up again on the previous day, over and over, improving with each repetition as a player improves with replay. But in the end he breaks out of the loop, and the film resolves itself in Hollywood fashion. Catharsis has to come to an end. Video games offer something else, which millions now prefer: flow, the pleasure of losing oneself in an activity, and the suggestion that the moment might go on forever.</p>`,

  `<p>In her TED talk, the game designer Jane McGonigal shows a gamer about to achieve an &ldquo;epic win&rdquo;: a sense of urgency, a little fear, and &ldquo;deep, deep focus on tackling a really difficult problem.&rdquo; Whatever we think of her hope that games can change the world, the intensity is real. It is what the psychologist Mihaly Csikszentmihalyi called flow, and game designers cultivate it deliberately, keeping play in a narrow channel between boredom and anxiety. Flow is as important to video games as catharsis is to Hollywood film, and games show how readily digital media lend themselves to it.</p>`,

  `<p>The first YouTube video, posted in 2005, shows one of the site&rsquo;s founders standing in front of the elephants at the San Diego Zoo. Within a few years YouTube, Facebook and Twitter had made possible a participatory flow culture that now reaches billions: one video leading to the next, a stream of messages with no need ever to end. Flow activities, once ranked below art, rose in status as the hierarchy of the arts broke down. And flow supports its own version of identity: not the dramatic arc of a life, but a self kept within bounds, in the channels a platform provides.</p>`,

  `<p>A time traveler from 1960 would have had flow experiences. She could have played tennis, sat through Andy Warhol&rsquo;s eight-hour film <em>Empire</em>, or watched television&rsquo;s continuous succession of programs and advertisements. What would surprise her is a young person watching YouTube videos while tweeting, scrolling a newsfeed and streaming music, all at once, and the fact that most of what flows past was made by other ordinary users. User-generated content shows popular modernism&rsquo;s ambivalence: a rejection of elitism, which some read as collective intelligence and others as the entrepreneurial American dream.</p>`,

  `<p>The <em>Matrix</em> and <em>Star Wars</em> films are cathartic; the <em>Matrix</em> and <em>Star Wars</em> video games offer flow; and many of the same people enjoy both. Catharsis and flow do not neatly divide old media from new, or older audiences from younger. They appear within a single medium, they blend in a single experience, and the media industry combines them in its transmedia franchises. They are better understood as the two ends of a scale, with a classic film like <em>Casablanca</em> at one end, a puzzle game like <em>Bejeweled</em> at the other, and most of our media somewhere in between.</p>`,

  `<p>In 2002 the artist Cory Arcangel hacked <em>Super Mario Bros.</em>, removing almost everything but the white clouds drifting across a blue sky. There was nothing left to play. Avant-garde games like <em>Super Mario Clouds</em> deny the player both flow and catharsis and ask instead what a game is: they call for reflection, the aim of twentieth-century modern art against the immersion of popular forms. Today reflection, too, has become popular, in Pixar&rsquo;s films and in hip-hop&rsquo;s remix. Catharsis, flow and reflection make a triangle, and our media culture fills its interior with hybrids.</p>`,

  `<p>In 1998 JAY-Z&rsquo;s &ldquo;Hard Knock Life&rdquo; set his own struggle for recognition as a rapper over a chorus sampled from the Broadway musical <em>Annie</em>. Rap grew in the 1970s from African American communities that combined the rapper&rsquo;s verbal art with the DJ&rsquo;s sampling of records, and its foundation, remix, was open to other forms: rappers were featured in one another&rsquo;s songs, and by the 2000s hip-hop and R&B had become hard to tell apart. Remix has not produced a single style but a proliferation of them. And rap is flow music: the word names the interplay of the rapper&rsquo;s rhymes and the beat.</p>`,

  `<p>In the film <em>Downfall</em> (2004), Hitler screams at his generals in his bunker as the Russians close in on Berlin. A few years later the scene became the source of hundreds of parodies on YouTube, each keeping the German dialogue and changing the subtitles so that Hitler rages at something else: an iPod without a camera, a soccer transfer, even the parodies themselves. The <em>Downfall</em> videos are a meme, made by repetition and variation, and remix is how memes spread. As Lawrence Lessig argues, remix has become a means of expression for millions of amateurs. In remix culture, no one cares who had the idea first, except those with a stake in the original: in 2010 the studio that owned Downfall tried to have the parodies removed from YouTube.</p>`,

  `<p>In 2000 the heavy metal band Metallica sued Napster, the file-sharing service, and its drummer Lars Ulrich testified against it before the U.S. Senate. Copying the band&rsquo;s songs, he wrote soon after, was theft: &ldquo;My band authored the music … We should decide what happens to it.&rdquo; A band born in rock rebellion was defending the modernist idea of the artist as sole creator and owner of the work. Today remixers answer that &ldquo;everything is a remix&rdquo; and claim a right to sample. Remix measures creativity by skillful borrowing and refashioning, as postmodern art did. Even T. S. Eliot praised the mature poet who steals, but he expected the theft to become a unique work of art.</p>`,

  `<p>Gregg Gillis, who records as Girl Talk, built his album <em>Night Ripper</em> from between two and two and a half hundred samples of popular songs, without permission for any of them. At his concerts, hundreds of fans dance ecstatically to music they recognize in fragments. Gillis has no interest in the avant-garde tradition, and yet he achieves what the avant-garde of the 1910s and 1920s wanted and failed to achieve: art integrated into the everyday life of its audience. Remix ignores the modern distinctions between art and craft, original and copy, artist and audience. It is popular postmodernism, and it is most like the historical avant-garde precisely when it is not trying to be.</p>`,

  `<p>At a Girl Talk concert the audience dances with hands raised, enveloped in sampled music that could go on forever. Remix is playing in the plenitude. In a culture of fragments, why not piece fragments together into new configurations? Remix takes samples from anywhere, and digital media and the Internet make almost everything available. Where modernism prized the individual artist&rsquo;s contribution to a tradition, remix celebrates the wealth of traditions it draws on, playing with many rather than advancing one. And remix culture is flow culture: repetitive, procedural, generating memes that always have one more variation.</p>`,

  `<p>An early-morning city park would surprise our time traveler from 1960: joggers of every age and fitness, many wearing trackers that count their steps and measure their heartbeats. The <em>Wired</em> writers Gary Wolf and Kevin Kelly helped to promote a movement around such practices, the &ldquo;Quantified Self.&rdquo; But the fascination with numbers extends far beyond exercise: election polls, stock reports, box office grosses and ranked lists have become everyday cultural fare. Institutions have long classified us; now we also classify ourselves, filling in profiles and rating our experiences. Yet the authority of numbers remains contested. Two popular films of the 2010s illustrate the contrast: <em>Moneyball</em> (2011) celebrates statistical analysis, while <em>Trouble with the Curve</em> (2012) vindicates the experienced scout&rsquo;s judgment over mere statistics.</p>`, // Jay, 2026-11-14.

  `<p>In Chaplin&rsquo;s <em>Modern Times</em> (1936), the Tramp falls onto the factory conveyor and is swallowed by the giant gears of the machine. In <em>2001: A Space Odyssey</em> (1968), the threatening machine is HAL, whose depths are gleaming rows of memory modules. Between the two films, the electronic computer had changed what a machine could be. Its operations depended on programs rather than a fixed arrangement of mechanical parts. A programmable computer can become many different machines, and its users must learn to participate in the procedures each program establishes.</p>`, // Jay, 2026-11-14.

  `<p>The player of <em>Candy Crush Saga</em> works against a move counter to get the candies in the right places, like Chaplin&rsquo;s Tramp at the assembly line, except that she experiences the activity as play rather than alienating labor. The game draws her into a repeating sequence of action and response that she wants to continue. Video games make procedures pleasurable, training their players for a digital culture in which entertainment and social life follow similar patterns. For the game designer and theorist Jane McGonigal, games can do more: people collaborating in games can develop solutions to real-world problems. Games take on the promise once made for avant-garde art—that a cultural practice can transform the world.</p>`, // Jay, 2026-11-14.

  `<p>In Sid Meier&rsquo;s classic game <em>Civilization</em>, you lead a people from 4000 BC to the near future, building cities, researching technologies and fighting wars. Historical elements become materials for new combinations: you may build the Eiffel Tower in Beijing. When the game ends, you can play again, make different choices and reach a different outcome. History offers no such opportunity. A scientific simulation can be rerun with different assumptions, but the world it models must live with what actually happens. Video games make this replayability a pleasure, offering a perpetual present whose future can be reimagined. Simulation and history represent competing ways of understanding our place in time.</p>`, // Jay, 2026-11-14.

  `<p>In Gonzalo Frasca&rsquo;s game <em>September 12</em>, you direct missile strikes at terrorists walking through a Middle Eastern town. The missiles also kill civilians, and other civilians respond by becoming terrorists. Your attempts to eliminate violence generate more of it. The game makes a political argument through a procedure that repeats without resolution. Conventional films and novels usually offer strong narratives: conflicts that move toward an ending. Games more often offer weak narratives, in which action continues or starts again. This difference reaches beyond entertainment. Political ideologies of the nineteenth and twentieth centuries told compelling stories about where history is going; a culture of simulation offers a present that can always be replayed.</p>`, // Jay, 2026-11-14.

  `<p>A novel or film carries its audience through a story; a simulation invites its players to act within procedures and try again. These different pleasures express a larger tension in contemporary culture. Some communities understand their lives through history and the coherent political stories of liberal democracy, socialism or nationalism. Others are more at home in the replayable worlds of games and procedural interfaces. The divide becomes political when simulation is offered as a way to solve society&rsquo;s problems. Can a procedure address those problems without confronting the history that produced them?</p>`, // Approved by Jay, 2026-11-14.

  `<p>A photograph of breakfast, a reaction to the news, a video of a family celebration: social media turn everyday life into material for publication. Publishing and broadcasting were once largely controlled by economic and cultural elites. Now billions of people can circulate their own words and images, and much of what they publish is themselves. Critics see a flood of amateur opinion and self-promotion; enthusiasts see liberation for people who never had a public voice. Social media extend the personal style once expressed through clothes, music and home decoration into an ongoing public performance of identity.</p>`, // Approved by Jay, 2026-11-14.

  `<p>In 1976 Tom Wolfe called the 1970s the &ldquo;Me Decade,&rdquo; an age of spiritual exploration and self-improvement. Christopher Lasch saw a culture of narcissism, turning away from politics and history toward personal well-being. Social media would later be blamed for a self-absorption that these critics had already described. In the same decade, the psychologist Mihaly Csikszentmihalyi developed his account of flow: complete absorption in an activity pursued for its own sake. What critics condemned as a retreat into the self could also be understood as a search for fulfillment. Flow and catharsis offer different ways of making experience meaningful, with consequences for identity and politics as well as entertainment.</p>`, // Approved by Jay, 2026-11-14.

  `<p>At a high school football game in 2010, the social media researcher danah boyd noticed teenagers sharing their phone screens with friends beside them, while many parents stared into their own devices. The teenagers were incorporating their phones into the social occasion. Social media also let people assemble a public identity from posts, photographs, comments and things they borrow and share. This is identity as remix, adapted to different audiences. A college applicant&rsquo;s essay and his MySpace page could present strikingly different selves, each responding to a different social world. The difficulty comes when an audience for one encounters the other.</p>`, // Approved by Jay, 2026-11-14.

  `<p>Aaron Sorkin&rsquo;s screenplay for <em>The Social Network</em> (2010) turns the rise of Facebook into a Hollywood story about Mark Zuckerberg&rsquo;s ambitions, conflicts and damaged relationships. A film about Facebook embraces a classic form of cathartic storytelling, but using Facebook itself calls for a very different kind of storytelling. A family photograph follows a political argument, a report of illness or a joke shared by a friend. Each may move us, but together they form a stream of fragments without a final resolution. Whatever their subject, the things people post also become part of their public identity. The whole network becomes a vast selfie: social networking is flow punctuated by moments of catharsis, with no ending built into the experience.</p>`, // Jay, 2026-11-14.

  `<p>In 2016 the <em>Wall Street Journal</em>&rsquo;s &ldquo;Blue Feed, Red Feed&rdquo; showed two streams of Facebook content side by side. The same topic could appear within radically different political worlds. Profiles, friendships and algorithmic filters help people find their way through the plenitude, but they also shape what people encounter and which communities they inhabit. These techniques were developed to sell advertising; they can also mobilize political identities. Donald Trump&rsquo;s campaign of 2016 brought personal self-presentation and politics together with particular force. Filling in a profile, following an account or sharing a post can become participation in a politics of flow.</p>`, // Approved by Jay, 2026-11-14.

  `<p>In January 2001, text messages helped bring protesters into the streets of the Philippines to demand the removal of President Joseph Estrada. Mobile communication could turn personal messages into collective action. Social media later offered new channels for organizing the Arab Spring uprisings and Occupy protests. Such gatherings can be powerful, but the communities they create are often temporary, united around an immediate goal. An enduring movement may produce a succession of brief campaigns, hashtags and protests. Social media bring the qualities of flow to collective life: people join, act and move on, while new expressions of solidarity take shape.</p>`, // Approved by Jay, 2026-11-14.

  `<p>On 4chan, anonymous contributors circulated images, jokes and memes in a stream of constant replacement. Some took that playful disruption beyond the imageboard. In 2008, a campaign against the Church of Scientology brought the loose collective Anonymous into public view, eventually sending masked protesters into the streets. Other actions defended WikiLeaks and supported Arab Spring protesters. Participants moved among causes without a single political program, mixing conviction, personal grievance and the pleasure of the prank. Anonymous carried flow from entertainment into politics: collective action could be intense even when its membership, motives and story kept changing.</p>`, // Approved by Jay, 2026-11-14.

  `<p>At the Democratic Convention in July 2016, speeches built toward moments of emotional identification, inviting audiences to place individual lives within a shared political story. Donald Trump&rsquo;s campaign offered a different rhythm: tweets, rallies and immediate reactions to the news, with story fragments rearranged as circumstances changed. The fragments could be intensely emotional without forming a consistent narrative. The contrast was between a politics organized around catharsis and one sustained by flow. Social media helped make this politics possible, carrying political performances beyond the gatekeepers who had traditionally controlled access to a mass audience.</p>`, // Approved by Jay, 2026-11-14.

  `<p>Suppose our time traveler could travel into the future. Would she find a world dominated by artificial intelligence, virtual reality or some medium not yet imagined? Such forecasts repeat the expectation that one technology will give an age its defining character. But our media culture accommodates many practices, and the arrival of new ones does not make the older ones disappear. Multiplicity is our future. In art and entertainment, people can find communities that share their tastes. Politics binds those communities to decisions they must make together. Can democratic institutions founded on the belief that political life makes sense over time accommodate a politics of flow?</p>`, // Approved by Jay, 2026-11-14.
];

// ── Consent dialog ──

function focusInput() {
  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
}

function chooseEntry(consent, edition) {
  saveConsent = consent;
  readingEdition = edition;
  document.getElementById('consent-overlay').style.display = 'none';
  focusInput();
}

document.getElementById('consent-contribute').addEventListener('click', () => chooseEntry(true, 'evolving'));
document.getElementById('consent-current').addEventListener('click', () => chooseEntry(false, 'evolving'));
document.getElementById('consent-original').addEventListener('click', () => chooseEntry(false, 'original'));

// ── Initialise first section ──

appendSectionBreak(0, false);
visitedSections.add(0);

// ── TOC navigation ──

// H-014: the contents list is built here, grouped by chapter; only the current chapter is open.
function buildToc() {
  const toc = document.getElementById('toc');
  toc.innerHTML = '';
  CHAPTERS.forEach((chapter, c) => {
    const last = c + 1 < CHAPTERS.length ? CHAPTERS[c + 1].firstSection : SECTION_TITLES.length;
    const group = document.createElement('div');
    group.className = 'toc-chapter';
    group.dataset.chapter = String(chapter.number);
    const head = document.createElement('button');
    head.className = 'toc-chapter-title';
    head.type = 'button';
    head.textContent = chapterHeading(chapter);
    head.addEventListener('click', () => group.classList.toggle('open'));
    const list = document.createElement('div');
    list.className = 'toc-sections';
    for (let i = chapter.firstSection; i < last; i += 1) {
      const item = document.createElement('button');
      item.className = 'toc-item';
      item.type = 'button';
      item.dataset.section = String(i);
      const num = document.createElement('span');
      num.className = 'toc-num';
      num.textContent = SECTION_NUMERALS[i];
      const title = document.createElement('span');
      title.className = 'toc-title';
      title.textContent = SECTION_TITLES[i];
      item.appendChild(num);
      item.appendChild(title);
      list.appendChild(item);
    }
    group.appendChild(head);
    group.appendChild(list);
    toc.appendChild(group);
  });
  markTocActive(sectionIndex);
}

function markTocActive(idx) {
  document.querySelectorAll('.toc-item').forEach(el => {
    const n = Number(el.dataset.section);
    el.classList.toggle('active', n === idx);
    el.classList.toggle('visited', visitedSections.has(n) && n !== idx);
    el.classList.toggle('complete', completedSections.has(n));
  });
  const current = String(chapterOf(idx).number);
  document.querySelectorAll('.toc-chapter').forEach(group => {
    group.classList.toggle('open', group.dataset.chapter === current);
    group.classList.toggle('current', group.dataset.chapter === current);
  });
  // Keep the active section in view within the list itself, without moving anything else.
  const toc = document.getElementById('toc');
  const active = document.querySelector('.toc-item.active');
  if (toc && active && typeof active.getBoundingClientRect === 'function') {
    const box = toc.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.top < box.top) toc.scrollTop -= box.top - item.top + 16;
    else if (item.bottom > box.bottom) toc.scrollTop += item.bottom - box.bottom + 16;
  }
  updateRunningPosition(idx);
}

// The running head says where the reader is: the chapter, and the section's numeral and title.
function updateRunningPosition(idx) {
  if (!runningPosition) return;
  runningPosition.textContent = '';
  const chapter = chapterOf(idx);
  const where = document.createElement('span');
  where.className = 'pos-chapter';
  where.textContent = chapter.label ? chapter.label : `Chapter ${chapter.number}`;
  runningPosition.appendChild(where);
  if (!chapter.label || SECTION_TITLES[idx] !== chapterHeading(chapter)) {
    runningPosition.appendChild(document.createTextNode(' · '));
    const section = document.createElement('span');
    section.className = 'pos-section';
    section.textContent = `${SECTION_NUMERALS[idx]} ${SECTION_TITLES[idx]}`;
    runningPosition.appendChild(section);
  }
}

buildToc();

function selectSection(newIdx) {
  if (newIdx === sectionIndex) return;
  saveCurrentSection();
  sectionHistoryStart = contributionHistory.length;
  sectionIndex = newIdx;
  visitedSections.add(newIdx);
  markTocActive(newIdx);
  appendSectionBreak(sectionIndex);
}

document.querySelectorAll('.toc-item').forEach(item => {
  item.addEventListener('click', () => {
    if (sending) return;
    closeContents();
    selectSection(Number(item.dataset.section));
    focusInput();
  });
});

// ── Contents on a narrow screen: a sheet opened from the running head ──

const contentsToggle = document.getElementById('contents-toggle');
const sideScrim = document.getElementById('side-scrim');

function openContents() {
  document.body.classList.add('contents-open');
  contentsToggle.setAttribute('aria-expanded', 'true');
  sideScrim.hidden = false;
}

function closeContents() {
  if (!document.body.classList.contains('contents-open')) return;
  document.body.classList.remove('contents-open');
  contentsToggle.setAttribute('aria-expanded', 'false');
  sideScrim.hidden = true;
}

contentsToggle.addEventListener('click', () => {
  if (document.body.classList.contains('contents-open')) closeContents(); else openContents();
});
sideScrim.addEventListener('click', closeContents);
document.getElementById('side-close').addEventListener('click', closeContents);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeContents(); });

// On a narrow screen the dock is pinned over the page; the page keeps room for it.
function measureDock() {
  const dock = document.getElementById('dock');
  if (dock) document.documentElement.style.setProperty('--dock-height', `${dock.offsetHeight}px`);
}
window.addEventListener('resize', measureDock);
measureDock();

// ── Finish button ──

finishBtn.addEventListener('click', async () => {
  if (saveConsent) {
    showFarewellSaving();
    await saveCurrentSection();
    showFarewellDone();
  } else {
    showFarewellDone();
  }
});

// ── Save and farewell ──

async function saveCurrentSection() {
  if (!saveConsent) return;
  const sectionToSave = sectionIndex;
  const slice = contributionHistory.slice(sectionHistoryStart);
  if (slice.length === 0) return;
  try {
    const res = await fetch('/api/evolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionIndex: sectionToSave,
        conversationHistory: slice,
        textId: 'digital-plenitude',
        sessionId: contributionSessionId,
        baseVersionId: editorialVersionIds.get(sectionToSave) || null,
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Editorial update failed');
    if (data.editorial?.versionId) editorialVersionIds.set(sectionToSave, data.editorial.versionId);
    return data;
  } catch (error) {
    appendSystemMessage(`Your contribution could not be saved: ${error.message}`);
    return null;
  }
}

function showFarewellSaving() {
  document.getElementById('farewell-saving').style.display = '';
  document.getElementById('farewell-done').style.display = 'none';
  document.getElementById('farewell').style.display = 'flex';
}

function showFarewellDone() {
  document.getElementById('farewell-saving').style.display = 'none';
  document.getElementById('farewell-done').style.display = '';
  document.getElementById('farewell').style.display = 'flex';
}

// ── DOM helpers ──

function appendSectionBreak(idx, scroll = true) {
  const el = document.createElement('div');
  el.className = 'section-break';

  // H-014: a chapter's first section opens under the chapter's heading.
  const chapter = CHAPTERS.find(ch => ch.firstSection === idx);
  if (chapter) {
    const chapterHead = document.createElement('div');
    chapterHead.className = 'chapter-heading';
    chapterHead.textContent = chapterHeading(chapter);
    el.appendChild(chapterHead);
  }

  const header = document.createElement('div');
  header.className = 'section-break-header';

  const num = document.createElement('span');
  num.className = 'section-break-num';
  num.textContent = SECTION_NUMERALS[idx];

  const title = document.createElement('span');
  title.textContent = SECTION_TITLES[idx];

  header.appendChild(num);
  header.appendChild(title);

  const introBox = document.createElement('div');
  introBox.className = 'section-break-intro';
  introBox.innerHTML = SECTION_INTROS[idx];

  el.appendChild(header);
  el.appendChild(introBox);
  conv.appendChild(el);

  // Automatic advancement happens while the thinking indicator already exists.
  // Keep it after the newly inserted opening rather than stranded above it.
  const thinking = document.getElementById('thinking');
  if (thinking) conv.appendChild(thinking);
  if (scroll) (thinking || el).scrollIntoView({ behavior: 'smooth', block: thinking ? 'end' : 'start' });
}

function renderText(container, text) {
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) container.appendChild(document.createTextNode(text.slice(last, m.index)));
    const a = document.createElement('a');
    a.href = m[2];
    a.textContent = m[1];
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    container.appendChild(a);
    last = re.lastIndex;
  }
  if (last < text.length) container.appendChild(document.createTextNode(text.slice(last)));
}

function appendGuideResponse(text, notes = null, media = null) {
  const turn = document.createElement('div');
  turn.className = 'turn';

  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = 'The text';

  const body = document.createElement('div');
  body.className = 'turn-body';

  // Split on [[IMAGE:id]] and [[MEDIA:id]] tokens; parts come in threes: text, kind, id
  const parts = text.split(/\[\[(IMAGE|MEDIA):([^\]]+)\]\]/);
  parts.forEach((part, i) => {
    if (i % 3 === 1) return;
    if (i % 3 === 2 && parts[i - 1] === 'MEDIA') {
      const item = media && media[part.trim()];
      if (item) {
        shownMedia.add(item.id);
        body.appendChild(MediaItems.render(item));
      }
      return;
    }
    if (i % 3 === 0) {
      part.split(/\n\n+/).forEach(para => {
        const trimmed = para.trim();
        if (trimmed) {
          const p = document.createElement('p');
          if (trimmed.startsWith('Sources: ')) p.className = 'turn-sources';
          CitationNotes.renderParagraph(p, trimmed, notes, renderText);
          body.appendChild(p);
        }
      });
    } else {
      const id = part.trim();
      const imgData = IMAGE_MAP[id];
      if (imgData) {
        shownImages.add(id);
        const img = document.createElement('img');
        img.src = imgData.src;
        img.alt = imgData.alt;
        if (imgData.credit) {
          // H-017: a picture whose licence asks for credit carries it underneath.
          const figure = document.createElement('figure');
          figure.className = imgData.figure ? 'response-figure' : 'response-image';
          const caption = document.createElement('figcaption');
          caption.className = 'image-credit';
          caption.textContent = imgData.credit + ' ';
          if (imgData.creditUrl) {
            const a = document.createElement('a');
            a.href = imgData.creditUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = 'Licence';
            caption.appendChild(a);
          }
          figure.appendChild(img);
          figure.appendChild(caption);
          body.appendChild(figure);
        } else {
          img.className = imgData.figure ? 'response-figure' : 'response-image';
          body.appendChild(img);
        }
      }
    }
  });

  turn.appendChild(label);
  turn.appendChild(body);
  conv.appendChild(turn);
  revealResponse(turn);
}

// Jay, 2026-11-03: a reply that fits is scrolled fully into view; a longer one keeps its
// beginning in view, and the reader scrolls down to finish it.
function revealResponse(el) {
  const pane = document.getElementById('left-col');
  const scrolls = pane && getComputedStyle(pane).overflowY !== 'visible';
  // On a narrow screen the window scrolls and the dock covers the bottom of it.
  const dock = document.getElementById('dock');
  const covered = scrolls ? 0 : (dock ? dock.offsetHeight : 0);
  const viewHeight = (scrolls ? pane.clientHeight : window.innerHeight) - covered;
  const fits = el.getBoundingClientRect().height <= viewHeight * 0.9;
  el.scrollIntoView({ behavior: 'smooth', block: fits ? 'end' : 'start' });
}

// The reader's words take their place in the reading, above the reply they draw, so
// that the conversation reads back as one (2026-11-14; before, they stood apart in the
// right-hand pane).
function appendReaderMessage(text) {
  const turn = document.createElement('div');
  turn.className = 'turn turn-reader';
  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = 'You';
  const body = document.createElement('div');
  body.className = 'turn-body';
  body.textContent = text;
  turn.appendChild(label);
  turn.appendChild(body);
  conv.appendChild(turn);
  return turn;
}

function showThinking() {
  const el = document.createElement('div');
  el.className = 'thinking';
  el.id = 'thinking';
  el.setAttribute('aria-label', 'The text is composing a reply');
  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = 'The text';
  const dots = document.createElement('div');
  dots.className = 'thinking-dots';
  dots.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i += 1) dots.appendChild(document.createElement('span'));
  el.appendChild(label);
  el.appendChild(dots);
  conv.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeThinking() {
  const el = document.getElementById('thinking');
  if (el) el.remove();
}

function appendSystemMessage(text, { retry = null } = {}) {
  const el = document.createElement('div');
  el.className = 'system-message';
  el.textContent = text;
  if (retry) {
    el.appendChild(document.createTextNode(' '));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Try again';
    btn.addEventListener('click', () => { el.remove(); retry(); });
    el.appendChild(btn);
  }
  conv.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Keep the writing position visible even while the reader looks elsewhere.
function updateCaretMarker() {
  input.parentElement.classList.toggle('show-caret', input.value === '' && input.placeholder === '');
}

// The button beside the input says what Enter would do: go on, or send what is written.
function updateGoButton() {
  const hasText = input.value.trim().length > 0;
  goBtn.textContent = hasText ? 'Send' : 'Go on';
  goBtn.setAttribute('aria-label', hasText ? 'Send your message' : 'Go on reading');
  goBtn.classList.toggle('has-text', hasText);
}

function fitInput() {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  measureDock();
}

// ── Send ──

function setSending(value) {
  sending = value;
  document.querySelectorAll('.toc-item').forEach(el => { el.disabled = value; });
  finishBtn.disabled = value;
  goBtn.disabled = value;
  input.setAttribute('aria-busy', String(value));
}

// `given` repeats a turn that failed: its words are already in the reading.
async function send(given = null) {
  if (sending) return;
  const text = (given === null ? input.value : given).trim();
  const continuing = !text;
  input.value = '';
  input.placeholder = '';
  updateCaretMarker();
  updateGoButton();
  fitInput();
  closeContents();
  if (!continuing && given === null) appendReaderMessage(text);
  input.focus();
  setSending(true);
  showThinking();

  try {
    // An exhausted section with no new prose advances in this same Enter press.
    for (;;) {
      if (continuing && completedSections.has(sectionIndex)) {
        if (sectionIndex === SECTION_TITLES.length - 1) {
          if (!endShown) appendSystemMessage('End of the final section.');
          endShown = true;
          break;
        }
        selectSection(sectionIndex + 1);
      }
      const activeSection = sectionIndex;
      const activeSectionHistory = sectionHistories.get(activeSection) || [];
      const firstContinuation = continuing && activeSectionHistory.length === 0;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, history: readingEdition === 'original' ? history : [], sectionIndex: activeSection,
          shownImages: Array.from(shownImages), shownMedia: Array.from(shownMedia), textId: 'digital-plenitude', edition: readingEdition,
          presentedFundEntryIds: Array.from(presentedFundEntryIds.get(activeSection) || []),
          ...(readingEdition !== 'original'
            ? {
                sectionHistory: activeSectionHistory,
                priorSectionSummaries: priorSectionSummaries(activeSection),
              }
            : {}),
          ...(editorialVersionIds.has(activeSection)
            ? { editorialVersionId: editorialVersionIds.get(activeSection) }
            : {}),
          ...(continuing
            ? {
                action: 'continue',
                firstContinuation,
                ...(readingEdition === 'original'
                  ? { sectionHistory: activeSectionHistory }
                  : {}),
              }
            : {})
        })
      });
      const data = await res.json();
      if (!res.ok || (!data.response && !(continuing && data.sectionComplete === true))) {
        throw new Error('No reading response');
      }
      if (data.editorial?.packageVersionId && !editorialVersionIds.has(activeSection)) {
        editorialVersionIds.set(activeSection, data.editorial.packageVersionId);
      }
      if (Array.isArray(data.editorial?.usedFundEntryIds)) {
        const used = presentedFundEntryIds.get(activeSection) || new Set();
        data.editorial.usedFundEntryIds.forEach(id => used.add(id));
        presentedFundEntryIds.set(activeSection, used);
      }
      if (typeof data.editorial?.sectionSummary === 'string' && data.editorial.sectionSummary.trim()) {
        sectionSummaries.set(activeSection, data.editorial.sectionSummary.trim());
      }
      if (data.response) {
        const turns = [
          { role: 'user', content: continuing ? CONTINUE_MESSAGE : text },
          { role: 'assistant', content: data.response }
        ];
        history.push(...turns);
        sectionHistories.set(activeSection, [...(sectionHistories.get(activeSection) || []), ...turns]);
        // Reading on is navigation, not a reader intervention for synthesis.
        if (!continuing) {
          contributionHistory.push(
            { role: 'user', content: text },
            { role: 'assistant', content: CitationNotes.plainReply(data.response, data.notes) }
          );
        }
        appendGuideResponse(data.response, data.notes, data.media);
      }
      if (continuing && data.sectionComplete === true) {
        completedSections.add(activeSection);
        markTocActive(sectionIndex);
      }
      if (data.response) break;
    }
  } catch (err) {
    // The reader's words stay in the reading; one press tries the same turn again.
    const attempt = continuing ? '' : text;
    appendSystemMessage(continuing ? 'The text could not go on just now.' : 'The text could not reply just now.', {
      retry: () => send(attempt),
    });
  } finally {
    removeThinking();
    setSending(false);
    updateCaretMarker();
    focusInput();
  }
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    send();
  }
});

goBtn.addEventListener('click', () => send());

input.addEventListener('input', () => {
  // This hint is only for the first use, not each newly cleared draft.
  if (input.value.length > 0) input.placeholder = '';
  updateCaretMarker();
  updateGoButton();
  fitInput();
});

updateGoButton();
markTocActive(sectionIndex);
