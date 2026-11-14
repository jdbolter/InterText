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
    // Chapter 4, Catharsis (2026-11-09).
    'section-19.md',
    'section-20.md',
    'section-21.md',
    'section-22.md',
    'section-23.md',
    // Chapter 5, Flow (2026-11-11).
    'section-24.md',
    'section-25.md',
    'section-26.md',
    'section-27.md',
    'section-28.md',
    'section-29.md',
    'section-30.md',
    'section-31.md',
    'section-32.md',
    'section-33.md',
    'section-34.md',
    'section-35.md',
    'section-36.md',
    'section-37.md',
    'section-38.md',
    'section-39.md',
    'section-40.md',
    'section-41.md',
    'section-42.md',
    'section-43.md',
    'section-44.md',
    'section-45.md',
    'section-46.md',
    'section-47.md',
    'section-48.md',
    'section-49.md',
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
    "Catharsis",
    "Fragmented Stories",
    "The Cinema of Immersion",
    "Catharsis in Video Games",
    "The Past and Future of Catharsis",
    "From Catharsis to Flow",
    "Games and Flow",
    "Flow Culture",
    "Our Time Traveler",
    "The Spectrum of Catharsis and Flow",
    "The Popular Avant-Garde",
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

    // Chapter 4. Drafted by Claude, 2026-11-09, for Jay's approval (vault: drafts/chapter-4-plan.md).
    `It is often said that we are living in a second Golden Age of Television. Mad Men, The Crown, Game of Thrones and Succession tell long stories about characters their viewers come to care about, and David Carr, the New York Times’ media columnist, wrote that such shows had become “much more like books.” Their aesthetic is the one that has dominated popular narrative for two centuries: catharsis, an aesthetic of tension and resolution, which tells a story of conflict that leads us to identify with the characters and feel an emotional release in the end. It shaped the Victorian novel and Hollywood film. But catharsis is not universal, and the avant-garde, from Brecht on, rejected it.`,

    `In Skyfall (2012), James Bond drives his old 1960s Aston Martin home to the family estate in Scotland, loses M, his boss and mentor, and the series resets itself, all in two hours, between chases, fights and betrayals. Cathartic storytelling now comes in many styles, some traditional, some fragmentary, some a mix of catharsis and flow: moments of identification sewn into a remix of genres, stories scattered across media in alternate reality games, nested story arcs in transmedia franchises from The Matrix to Marvel, and the long, tangled ending of Lost. Character remains at the center even when realism does not.`,

    `In November 2015 the New York Times gave a million of its subscribers a strange piece of cardboard: a Google Cardboard viewer for watching 360-degree video on a smartphone. VR video, often called Cinematic VR, is the digital form closest to film. In his 2015 TED talk, the filmmaker Chris Milk called VR “the ultimate empathy machine,” a medium that can move its viewers to sympathy and identification as no other can. His is a classic claim of remediation: that VR does better what film always meant to do. But Cinematic VR is at least as much film as VR. It offers no interaction beyond looking around, and the viewer remains a viewer.`,

    `In Gone Home (2013) you return to your family’s house in Oregon and find it empty. There is nothing to kill and no points to win: you read notes and listen to a journal until you understand that your sister has left home to live with the girl she loves. Some video games strive for catharsis: independent games like Gone Home and What Remains of Edith Finch, and mainstream ones like The Last of Us, later made into an HBO series. Their power to move the player comes from techniques borrowed from film and television, and the interaction has little to do with the emotion. Cathartic games remain a limited genre within the plenitude of video games.`,

    `“We’ll always have Paris,” Bogart tells Bergman at the end of Casablanca. Hollywood drama has long looked back, and the second Golden Age of Television has made nostalgia a defining motif, from Mad Men to The Crown. Psychologists and philosophers from Jerome Bruner to Steven Pinker treat this kind of storytelling as a human universal. It is not: it was perfected in the novels, plays and films of the past two centuries, and it is not what Aristotle meant when he first applied the term to Greek tragedy. Catharsis is a modern aesthetic. It can still reach younger audiences, as the Harry Potter franchise showed, but its audience is aging, and an alternative has been gaining in status through video games.`,

    // Chapter 5. Drafted by Claude, 2026-11-11, for Jay's approval (vault: drafts/chapter-5-plan.md).
    `When Edge of Tomorrow came out in 2014, Wired called it “the best videogame you can’t play.” Its hero, Bill Cage, dies in combat with aliens and wakes up again on the previous day, over and over, improving with each repetition as a player improves with replay. But in the end he breaks out of the loop, and the film resolves itself in Hollywood fashion. Catharsis has to come to an end. Video games offer something else, which millions now prefer: flow, the pleasure of losing oneself in an activity, and the suggestion that the moment might go on forever.`,

    `In her TED talk, the game designer Jane McGonigal shows a gamer about to achieve an “epic win”: a sense of urgency, a little fear, and “deep, deep focus on tackling a really difficult problem.” Whatever we think of her hope that games can change the world, the intensity is real. It is what the psychologist Mihaly Csikszentmihalyi called flow, and game designers cultivate it deliberately, keeping play in a narrow channel between boredom and anxiety. Flow is as important to video games as catharsis is to Hollywood film, and games show how readily digital media lend themselves to it.`,

    `The first YouTube video, posted in 2005, shows one of the site’s founders standing in front of the elephants at the San Diego Zoo. Within a few years YouTube, Facebook and Twitter had made possible a participatory flow culture that now reaches billions: one video leading to the next, a stream of messages with no need ever to end. Flow activities, once ranked below art, rose in status as the hierarchy of the arts broke down. And flow supports its own version of identity: not the dramatic arc of a life, but a self kept within bounds, in the channels a platform provides.`,

    `A time traveler from 1960 would have had flow experiences. She could have played tennis, sat through Andy Warhol’s eight-hour film Empire, or watched television’s continuous succession of programs and advertisements. What would surprise her is a young person watching YouTube videos while tweeting, scrolling a newsfeed and streaming music, all at once, and the fact that most of what flows past was made by other ordinary users. User-generated content shows popular modernism’s ambivalence: a rejection of elitism, which some read as collective intelligence and others as the entrepreneurial American dream.`,

    `The Matrix and Star Wars films are cathartic; the Matrix and Star Wars video games offer flow; and many of the same people enjoy both. Catharsis and flow do not neatly divide old media from new, or older audiences from younger. They appear within a single medium, they blend in a single experience, and the media industry combines them in its transmedia franchises. They are better understood as the two ends of a scale, with a classic film like Casablanca at one end, a puzzle game like Bejeweled at the other, and most of our media somewhere in between.`,

    `In 2002 the artist Cory Arcangel hacked Super Mario Bros., removing almost everything but the white clouds drifting across a blue sky. There was nothing left to play. Avant-garde games like Super Mario Clouds deny the player both flow and catharsis and ask instead what a game is: they call for reflection, the aim of twentieth-century modern art against the immersion of popular forms. Today reflection, too, has become popular, in Pixar’s films and in hip-hop’s remix. Catharsis, flow and reflection make a triangle, and our media culture fills its interior with hybrids.`,

    `In 1998 JAY-Z’s “Hard Knock Life” set his own struggle for recognition as a rapper over a chorus sampled from the Broadway musical Annie. Rap grew in the 1970s from African American communities that combined the rapper’s verbal art with the DJ’s sampling of records, and its foundation, remix, was open to other forms: rappers were featured in one another’s songs, and by the 2000s hip-hop and R&B had become hard to tell apart. Remix has not produced a single style but a proliferation of them. And rap is flow music: the word names the interplay of the rapper’s rhymes and the beat.`,

    `In the film Downfall (2004), Hitler screams at his generals in his bunker as the Russians close in on Berlin. A few years later the scene became the source of hundreds of parodies on YouTube, each keeping the German dialogue and changing the subtitles so that Hitler rages at something else: an iPod without a camera, a soccer transfer, even the parodies themselves. The Downfall videos are a meme, made by repetition and variation, and remix is how memes spread. As Lawrence Lessig argues, remix has become a means of expression for millions of amateurs. In remix culture, no one cares who had the idea first, except those with a stake in the original: in 2010 the studio that owned Downfall tried to have the parodies removed from YouTube.`,

    `In 2000 the heavy metal band Metallica sued Napster, the file-sharing service, and its drummer Lars Ulrich testified against it before the U.S. Senate. Copying the band’s songs, he wrote soon after, was theft: “My band authored the music … We should decide what happens to it.” A band born in rock rebellion was defending the modernist idea of the artist as sole creator and owner of the work. Today remixers answer that “everything is a remix” and claim a right to sample. Remix measures creativity by skillful borrowing and refashioning, as postmodern art did. Even T. S. Eliot praised the mature poet who steals, but he expected the theft to become a unique work of art.`,

    `Gregg Gillis, who records as Girl Talk, built his album Night Ripper from between two and two and a half hundred samples of popular songs, without permission for any of them. At his concerts, hundreds of fans dance ecstatically to music they recognize in fragments. Gillis has no interest in the avant-garde tradition, and yet he achieves what the avant-garde of the 1910s and 1920s wanted and failed to achieve: art integrated into the everyday life of its audience. Remix ignores the modern distinctions between art and craft, original and copy, artist and audience. It is popular postmodernism, and it is most like the historical avant-garde precisely when it is not trying to be.`,

    `At a Girl Talk concert the audience dances with hands raised, enveloped in sampled music that could go on forever. Remix is playing in the plenitude. In a culture of fragments, why not piece fragments together into new configurations? Remix takes samples from anywhere, and digital media and the Internet make almost everything available. Where modernism prized the individual artist’s contribution to a tradition, remix celebrates the wealth of traditions it draws on, playing with many rather than advancing one. And remix culture is flow culture: repetitive, procedural, generating memes that always have one more variation.`,

    `An early-morning city park would surprise our time traveler from 1960: joggers of every age and fitness, many wearing trackers that record each step and heartbeat. Gary Wolf and Kevin Kelly of Wired called this the “Quantified Self.” Our media culture has embraced numbers: daily polls in election seasons, stock reports and box office grosses, ranked lists of the hundred best films and novels. Viktor Mayer-Schönberger and Kenneth Cukier call it datafication. Institutions have long classified us invisibly, but now millions take part willingly, filling in profiles and ratings. Not everyone welcomes it: Moneyball celebrates the statisticians, and Trouble with the Curve the old scout’s instinct.`,

    `In Chaplin’s Modern Times (1936), the Tramp, mesmerized by his repetitive work on the assembly line, falls onto the conveyor and is swallowed by the giant gears of the machine. Thirty years later, in 2001: A Space Odyssey, the threatening machine is HAL, whose depths are gleaming rows of memory modules running an invisible program. Between the two, the electronic computer had changed what a machine is. The game designer and scholar Ian Bogost calls the computer’s operation procedurality: a programmable machine can become any number of machines, and each program reconfigures its users too, who must become part of the procedure to use it.`,

    `The player of Candy Crush Saga works against a move counter to get the candies in the right places, like Chaplin’s Tramp at the assembly line, except that she experiences it as play rather than alienating labor. Video games are procedural: characters are sets of parameters, and the event loop inserts the player so seamlessly into the procedure that she wants it to go on. Games train us for digital culture. For the game designer Jane McGonigal, they can do more: “Very big games,” she writes, are “the best hope we have for solving the most complex problems of our time.” Games are salvational for her, as art was for the avant-garde.`,

    `In Sid Meier’s Civilization, you lead a people from 4000 BC to the near future, building cities, researching technologies and fighting wars, and you may build the Eiffel Tower in Beijing. When the game ends, you can play again as the same civilization or another, make different choices and reach a different outcome. History never allows that: it moves in one direction and cannot be called back. Video games, like scientific simulations, can always be rerun, and their players live in a perpetual present whose future can be reimagined. This paradigm of simulation now exists beside the historical sensibility in our media culture.`,

    `In Gonzalo Frasca’s game September 12 (2003), you fire missiles at terrorists in a small Middle Eastern town, but each strike kills civilians and turns their mourners into terrorists. You can never win. The game makes its argument about the war on terror through its procedures, what Ian Bogost calls procedural rhetoric. Games can be political. But they rarely tell strong narratives, stories of conflict that move confidently toward resolution, as novels and films do. Their narratives are weak: repetitive, without a clear end. And the great political ideologies of the last two centuries were strong narratives.`,

    `One of the great fault lines in our media culture runs through three keywords: datafication, procedurality and simulation. On one side are communities that still see each person as part of a historical process, connected to the past by coherent stories; they prefer novels and films, and the strong political narratives of liberal democracy or socialism. On the other are communities at home with procedural interfaces and games, for whom simulation replaces history and the present can always be replayed. To believe that games can solve our problems is to leave history, and politics, out of the procedural equation.`,

    `Only a couple of decades ago, economic and cultural elites controlled publishing and broadcasting. Today Facebook, Instagram, Twitter and the other social media platforms give billions of people the chance to publish whatever they like, and what most of them publish is themselves: what they are doing, what they see, bits of their lives. For critics such as Andrew Keen, this is “the sheer noise of a hundred million bloggers all simultaneously talking about themselves.” For enthusiasts, it is liberation for those who never had a voice. Either way, social media make everyone who takes part into an author who must style a persona.`,

    `In 1976 Tom Wolfe called the 1970s the “Me Decade,” with its New Age spirituality, health fads and meditation, the beat that goes “Me … Me … Me.” Two years later Christopher Lasch described a culture of narcissism, turning from politics to self-examination. Today critics blame Facebook and YouTube for a new narcissism, but the complaint is not new. In the same decade, the psychologist Mihaly Csikszentmihalyi defined flow, a secular version of the Me generation’s spirituality and a therapy for individuals in a society without shared values. Flow and catharsis, weak and strong narrative, now reach beyond entertainment into social and political life.`,

    `At a high school football game in 2010, the researcher danah boyd noticed that the teenagers shared their phones with the friends beside them, while their parents stared into their own devices, barely looking up when a touchdown was scored. Social media do not simply isolate the young; they extend their social lives. But each Facebook page is also a performance: a face presented to a networked audience, built from posts, photos and comments that trickle into friends’ feeds over the years. This is identity as remix, fluid and fragmentary, so that the same person can present one self to friends and another to an admissions officer.`,

    `Aaron Sorkin’s film The Social Network (2010) explains the rise of Facebook in Hollywood terms, through the complicated and flawed humanity of Mark Zuckerberg. But being on Facebook calls for a different kind of storytelling. The stories in a News Feed are weak narratives: repetitive, fragmentary, without a sense of an ending, flowing up the screen as fast as you and your friends post them. Every platform invites you to tell your own story, so that the whole network becomes a vast selfie. Social networking is flow punctuated by catharsis, and your participation is never meant to end.`,

    `In 2016 the Wall Street Journal published “Blue Feed, Red Feed,” a page that showed side by side what liberal and conservative Facebook users saw on topics such as guns and abortion: two completely different political worlds. Eli Pariser had warned of such filter bubbles. Users want filters to navigate the plenitude, and the algorithms that profile them for advertisers serve politics just as well. Donald Trump’s campaign showed how social media merge the personal and the political: his identity politics centered not on race or history but on one individual, himself. Digital media did not create America’s separate information communities, but they intensify them.`,

    `In 2001 protesters in the Philippines, summoned by text messages, helped oust President Joseph Estrada; Howard Rheingold called them a smart mob. A decade later, Facebook and Twitter were credited with the uprisings of the Arab Spring, and Egypt tried to shut off the Internet. Clay Shirky saw a “marriage of technology and human generosity.” It is more like a temporary liaison. The collective actions of social media, from flash mobs to Occupy Wall Street, are intense but short-lived, their stories simple or fragmentary. Social media bring the same weak narrative and flow to collective politics that they bring to individual identity.`,

    `4chan’s /b/ board is a flow of anonymous images, cats and naked bodies, replaced almost every second: the weakest of narratives. From it came Anonymous. In 2008, when the Church of Scientology tried to have an embarrassing Tom Cruise video removed from YouTube, Anonymous flooded the church’s websites, and protesters in Guy Fawkes masks gathered outside its offices around the world. Its members drifted from pranks into hacktivism without a political program, defending above all the free flow of information. WikiLeaks under Julian Assange followed a similar logic of disclosure for disclosure’s sake. This is the politics of flow.`,

    `During the 2016 campaign, Donald Trump could fire off a tweet in response to a morning news show and hear the same show report it minutes later. In place of an overarching story, he offered emotional story fragments, rearranged from week to week. The Democratic Convention, by contrast, was a procedural masterpiece of cathartic narrative, building night by night to its crescendos. American politics has become a contest between an older narrative politics and a politics of flow. A candidate without traditional qualifications is the political version of the breakdown of elitism in the arts, and social media provide the matrix.`,

    `Suppose our time traveler could go the other way, into the future. Many forecasters have imagined what she would find: a world remade by virtual reality, artificial intelligence or the culture of remix. But no single technology or practice is likely to dominate. In each of the dichotomies of our media culture, catharsis and flow, originality and remix, the organic and the procedural, history and simulation, the older term is not disappearing. Multiplicity is our future, and it is no danger to art or entertainment, where each of us can find a corner of the plenitude. Politics is different: decisions are collective, and the politics of flow threatens the shared story democracy depends on.`,
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
    null, null, null, // H-014: chapter 2
    // H-017: section 11, the bed-in photograph (the book's figure 2.1).
    [
      { id: 'lennon-ono-bed-in', prompt: "A photograph of John Lennon and Yoko Ono's bed-in for peace at the Amsterdam Hilton in 1969 is available, the couple in bed under hand-lettered signs reading HAIR PEACE and BED PEACE. When discussing the bed-in, embed the token [[IMAGE:lennon-ono-bed-in]] at the natural point in your response." },
    ],
    null, null, null, null,
    null, null,
    // H-017: the diagram of the four spectrums (Jay, 2026-11-06).
    [
      { id: 'spectrums', prompt: 'A diagram of the four spectrums is available: catharsis and flow (response), originality and remix (making), the organic or spontaneous and procedurality or datafication (process), history and simulation (time), with the values of tradition on one side and those of the media future on the other. When you set out the four pairs together, embed the token [[IMAGE:spectrums]] on a line of its own after the paragraph that names them, and let your prose explain them.' },
    ],
    null, null, null, null, null, // chapter 4
    null, null, null, null, // chapter 5: sections 24 to 27
    // Jay's diagrams 5.2 and 5.5, freed 2026-11-06.
    [
      { id: 'flow-and-catharsis', prompt: "A diagram of the spectrum of catharsis and flow is available: a horizontal scale from catharsis to flow, with Titanic, Casablanca, Downton Abbey and The West Wing near the catharsis end; The Matrix, Skyfall, Edge of Tomorrow and Lost toward the middle; second-screen television and YouTube at the middle; Gone Home, Edith Finch and I Love Bees beyond it; and Facebook, Music for Airports, “Lose Yourself,” Twitter and Bejeweled toward flow. When you place works between catharsis and flow, embed the token [[IMAGE:flow-and-catharsis]] on a line of its own after the paragraph that does so, and let your prose explain it." },
    ],
    [
      { id: 'three-aesthetics', prompt: "A diagram of the three aesthetics is available: a triangle with catharsis, flow and reflection at its corners, with Titanic and Casablanca near catharsis, Bejeweled and Music for Airports near flow, Un Chien Andalou, Ulysses, Untitled-Game and Super Mario Clouds toward reflection, and Mother Courage, Passage, Scary Movie, Toy Story, Lost, The Matrix and Edith Finch in the interior. When you set out catharsis, flow and reflection together, embed the token [[IMAGE:three-aesthetics]] on a line of its own after the paragraph that names them, and let your prose explain it." },
    ],
    // Chapters 6 to 8 and the Conclusion (drafts, 2026-11-11): sections 30 to 48 have no figures shown.
    null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
    // Jay's diagram 9.1.
    [
      { id: 'dichotomies', prompt: "A diagram of the four dichotomies is available: catharsis and flow, originality and remix, the organic or spontaneous and procedurality or datafication, history and simulation, with the traditional term of each pair on the left and the newer on the right. When you set out the dichotomies together, embed the token [[IMAGE:dichotomies]] on a line of its own after the paragraph that names them, and let your prose explain it." },
    ],
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

The first time a person appears in the conversation, say in a few words who they are; in every later reply, the surname alone is enough.

Write in prose paragraphs, which are all the page can show. When a figure is available, embed its token where it belongs and let the prose carry the explanation. The plural of spectrum, in this work, is spectrums.

Use web search for what you do not hold: current events, recent works, and outside sources the reader asks about. The names, dates and details you already hold are authoritative, and an outside detail never alters them. Whatever you draw from a search reaches the reader as a numbered note added to your sentence, so the reply itself carries no list of sources or links, and the source's author or publication is named in the sentence only when the reader needs to know who said it.

Keep each reply to two or three short paragraphs, at most 250 words. Unfold the ideas gradually, following the reader's questions, so that the reader discovers them in conversation. Later parts of the work take up their own subjects in their turn.

An example of the manner, on a subject from later in the work:

Reader: But the Met still decides what counts as art, surely?
Text: The Met decides what hangs in the Met, and its curators' judgment still carries great weight with collectors, critics and the artists who seek their notice. On the web, the Met's site and deviantART's load in the same browser and compete for the same searches, and deviantART draws more visitors. Prestige survives as the currency of one large community among many. It no longer settles what counts as art for everyone.
Reader: Surely prestige still matters more than traffic.
Text: Prestige matters most to those who confer it and those who seek it. Artists who post to deviantART count views, favourites and comments, and many of them never seek a curator's notice at all. Two currencies now circulate side by side, with no fixed rate of exchange between them.`,

  // H-002, reworded by H-003: replaces the shared continuation paragraph (api/lib/reading-continuation.js) for this text only.
  // 2026-11-14: "below" became "you hold", since these lines now come after the passage in the prompt (H-020).
  continuationVoice: `Carry the conversation forward with the next ideas you hold and their concrete details, in the same voice, as a natural passage of two or three short paragraphs, at most 250 words. A brief link to the reader's interests may lead in. The passage then moves on through what remains and ends on an idea about the world.`,

  // H-003: replaces the shared continuation framing and Return-turn messages (ordinary readings only).
  continuationWording: {
    cursor: `The exchanges so far mark how far the conversation has reached. Resume with the first idea you hold that has not yet been said. An idea or example counts as said once any earlier reply has given it, a reply to the reader's question included, so go past it to what is new, and leave long digressions aside.`,
    opening: `The reader has read only the boxed opening, a prologue whose details may anticipate ideas from anywhere in what you hold; that does not mean those ideas have been said. Only the first paragraphs are supplied on this turn. Begin there and connect them to the box's final thought, staying within them; stopping partway is fine. Say every idea, example, distinction and transition in them, without repeating facts the box already gave.`,
    completion: `When every idea you hold here, with useful elaboration, has been said in the conversation, put [[SECTION_COMPLETE]] on a line by itself after the final paragraph. If everything was already said, return only [[SECTION_COMPLETE]]. Otherwise leave the marker out. Say only what you hold; the next part of the work comes in its turn. The marker is a private signal to the interface, never prose for the reader.`,
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
- Anyone the reader has already met, in the opening box or an earlier reply, is named by surname alone. Where the draft gives such a person a description again, keep only the surname.
- Where the draft remarks on the reader's point (granting it, praising it, calling it right or sharper, saying that an idea should be narrowed, withdrawn or revised), state the revised idea itself instead, with its evidence. The reader will recognise the contribution in the idea. One exception: a plain, short acknowledgment that a fact was wrong, when the reader caught a real factual error, stays.
- An objection may be put and met in the work's own voice ("One might object that…; yet…"); keep that form where the draft uses it.
- Where the draft refers to the reader, to the conversation or an earlier reply, or to the work's own claim, thesis, argument, main line, point, account, section or chapter, say directly what is true of the world instead.
- Do not repeat what the work's earlier replies have already said. Where the draft reuses a phrase, an example or a closing sentence from them, put it in fresh words or let it go, and end on a thought the earlier replies have not ended on. The book's own formulas (such as "almost, but not quite, vanished") appear at most once in a conversation.
- Apart from such repetition, keep every idea, example, name, date, figure, quotation and citation with its page that the draft contains, and add none.
- Keep anything in double square brackets exactly as it is, in the same place.
- Keep the reply in prose paragraphs. Where the draft sets something out as a table, a list or a diagram drawn in characters, put it into sentences. The plural of spectrum is spectrums.
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
    { number: 4, title: 'Catharsis', firstSection: 18, point: "Catharsis is an aesthetic of tension and resolution, and it can shape the experience of music as well as of narrative. In narrative media, from the novel and melodrama to Hollywood film and television drama, it takes the form of a story of conflict and resolution that leads the audience to identify with the main characters and feel an emotional release in the end. Catharsis remains the favored style in the second Golden Age of Television, in transmedia franchises, in VR film and even in some video games, which borrow the technique from film. But it is not universal. Catharsis is a modern style, perfected over the last two centuries and rejected by the avant-garde, and it has become nostalgic, both in its themes and in its longing for a time when serious drama dominated the culture. Its audience is aging, and a popular alternative, flow, has gained in status, above all through video games." },
    { number: 5, title: 'Flow', firstSection: 23, point: "Flow is an aesthetic of engagement that wants to go on indefinitely: a state in which, as the psychologist Mihaly Csikszentmihalyi put it, people are so involved in an activity that nothing else seems to matter. Where catharsis must come to an end, flow seeks to continue. It is the principal pleasure of video games and of social media, from Tetris to the endless feeds of YouTube and TikTok, and it has a long history in sports, games, meditation and the avant-garde, from Cage and Warhol to Eno and Glass. The breakdown of the hierarchy of the arts has given flow experiences a status beside catharsis that they never had before. Catharsis and flow are the endpoints of a spectrum, and the spectrum opens into a triangle when reflection, the aim of the twentieth-century avant-garde, is added as a third pole. Today reflection, too, has become popular entertainment." },
    { number: 6, title: "Remix and Originality", firstSection: 29, point: "Remix, the sampling and recombining of existing material, took its present form in the hip-hop of the 1970s and has become a practice of millions, from professional producers such as JAY-Z and Beyoncé to amateurs on YouTube and social media. It stands in creative opposition to originality, the modernist and popular modernist conviction that the artist is the sole creator of a unique work, which copyright law still enforces. Remix either dissolves originality or redefines it as the skillful mixing of materials. It is popular postmodernism, unconcerned with the dialogue with modernism that occupied postmodern art, and yet it achieves what the historical avant-garde wanted: art integrated into the lives of its audience. Remix is playing in the plenitude, and remix culture is flow culture." },
    { number: 7, title: "Procedurality, History, and Simulation", firstSection: 34, point: "Datafication, procedurality and simulation are the keywords of a great fault line in our media culture. Our society quantifies itself, from fitness trackers to polls, box office figures and ranked lists, and millions take part willingly in datafication and classification. The computer turned mechanization into procedurality, and video games train their players in parameters and event loops; for enthusiasts such as Jane McGonigal, procedural games can even save the world. Games are simulations, and simulations can be replayed, whereas history, as the modern West has understood it, moves in one direction and cannot be called back. Games tend toward weak narratives, repetitive and without resolution, where the political ideologies of the last two centuries were strong narratives. On one side of the procedural divide are communities committed to history and strong narrative; on the other, communities for whom simulation replaces history." }, // draft, 2026-11-11, for Jay's approval
    { number: 8, title: "Social Media and the Politics of Flow", firstSection: 40, point: "Social media are the most visible manifestation of the plenitude: billions publish themselves, bypassing the elites who once controlled publication, and critics from Keen to Lanier see a cultural disaster where enthusiasts see liberation. Social media are identity media, and the identity they construct is remix: fluid, fragmentary and adapted to multiple audiences. They are flow media and the medium of weak narratives, and they bring the same qualities to politics: the brief collective actions of flash mobs, smart mobs and Occupy, the hacktivism of Anonymous, and WikiLeaks' disclosure for disclosure's sake. Donald Trump's campaign of 2016 showed how the personal and the political merge in a politics of flow, emotional story fragments in place of coherent narrative, which challenges a democratic politics founded on catharsis." }, // draft, 2026-11-11, for Jay's approval
    { number: 9, title: "Conclusion", label: "Conclusion", firstSection: 48, point: "Forecasts that one technology or practice will dominate our media future owe a debt to McLuhan's popular modernism. The dichotomies of catharsis and flow, originality and remix, the organic and the procedural, history and simulation are spectrums, and in each the older term is not disappearing. Our media culture is a multiplicity of communities, and this multiplicity is our future: there was never a golden age of shared standards, only the agreement of the dominant classes. The breakdown of hierarchy in arts and culture poses no danger. The danger is political: democracy depends on a politics of catharsis, a shared belief that political life makes sense over time, and the politics of flow threatens that assumption." }, // draft, 2026-11-11, for Jay's approval
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
    "No single practice (networks, remix, social media, video games) can characterize the whole media culture, because each defines communities with millions of outsiders. Instead, four dichotomies, offered as partial characterizations and paths through a vast networked culture, delineate large parts of it: catharsis and flow, originality and remix, procedurality and the organic or spontaneous, simulation and history. They are the endpoints of spectrums, not rigid categories, and though one term in each pair seems to stand for the media future, its counterpart does not disappear.",
    // Chapter 4 (drafts, for Jay's approval).
    "Catharsis in popular drama is a story of conflict and resolution that leads the viewer to identify with the main characters and feel an emotional release. It defined Victorian fiction, melodrama and the Golden Ages of Hollywood film and television, and it still underlies prestige television drama. But this is not what Aristotle meant when he used the term to describe Greek tragedy. In the twentieth century, Bertolt Brecht and other avant-garde artists sought to subvert catharsis in their work. Although the audience that enjoys this kind of storytelling is growing older, catharsis is nevertheless unlikely to disappear as an aesthetic principle.",
    "In the current media economy there are many styles of cathartic storytelling. Some are traditional. But some are fragmentary; others a contemporary mix of catharsis and flow. Bond films sew cathartic moments into a remix of chases, fights and betrayals; alternate reality games scatter a story across media and puzzles and lose catharsis along the way; transmedia franchises from The Matrix to the Marvel Universe nest many story arcs and moments of catharsis; and the ending of Lost is a nostalgic remix of Hollywood gestures. Character remains central to narrative technique even when realism does not.",
    "VR video (often called Cinematic VR, CVR) is the digital form closest to film. In his 2015 TED talk, Chris Milk called VR an empathy machine that can move its viewers to sympathy and identification more powerfully than any earlier medium, a classic claim of remediation: that VR does better what film always meant to do. But CVR is at least as much film as VR: it offers no interaction beyond looking around, and the viewer remains a viewer.",
    "Some video games strive for catharsis. There are cathartic indie games such as Gone Home, That Dragon, Cancer and What Remains of Edith Finch. There are cathartic mainstream games, such as The Last of Us, which was later made into a compelling HBO series. The cathartic quality of such games comes from techniques borrowed from film and television, while the interaction has little to do with the emotional engagement. Interactivity and coherent storytelling are challenging to combine. So cathartic games remain a limited genre within the plenitude of video games.",
    "Catharsis is a modern aesthetic, not a universal human value: the psychological storytelling that Bruner, Dennett, Pinker and others take to be universal was perfected in the novels, plays and films of the last two centuries. It is also nostalgic, in its themes and in its longing for a time when serious drama dominated media culture. It can still reach younger audiences, as the Harry Potter franchise showed, but a popular alternative has been gaining in status, above all through video games.",
    // Chapter 5 (drafts, for Jay's approval).
    "Catharsis must come to an end; flow wants to go on forever. The film Edge of Tomorrow (2014), which Wired called the best video game you can’t play, borrows a game’s replay and then resolves it in Hollywood fashion. Millions now prefer the flow of games and social media, the state of complete involvement that Csikszentmihalyi described, here extended to more passive experiences such as watching one video after another. Music shows both aesthetics and their mixture: the cathartic music of the nineteenth century against the flow of gamelan, Glass, Eno’s ambient music and hip-hop.",
    "Flow is as important to video games as catharsis is to Hollywood film. Shooters, platformers and puzzle games draw the player into a potentially endless loop, and designers deliberately keep play in the flow channel between boredom and anxiety. Games have gained economic and cultural status, a diverse audience and an academic discipline, and they show how all digital media lend themselves to flow: the user becomes part of the program's event loop.",
    "Flow culture flourishes in digital media and appeals especially, though not only, to the young. Personal music, from the iPod to streaming on the smartphone, and social media from blogs to YouTube, Twitter and TikTok, each offer a different version of flow; YouTube realizes what Manovich called database cinema. Flow activities rose in status as the hierarchy of the arts broke down. And flow is therapeutic: the identity it constructs on social media is homeostatic, keeping itself within bounds rather than joining a larger historical drama.",
    "A time traveler from 1960 would have known flow from sports and games, from the avant-garde of Cage and Warhol, and from the flow of television that Raymond Williams described. What would surprise her is the polyaesthetic flow of young people moving among many channels at once, and the fact that much of what flows is made by ordinary users. User-generated content shows popular modernism's ambivalence: a rejection of elitism, read either as collective intelligence or as the entrepreneurial American dream.",
    "Catharsis and flow are not a simple contrast between old and new media or between older and younger audiences. Both appear within the same medium, they blend in the same experience, and transmedia franchises combine them, cathartic films beside flowing games. They are the endpoints of a scale, from Casablanca to Bejeweled, on which most media forms find a place.",
    "Some games violate flow altogether: the avant-garde games that Brian Schrank describes, from Super Mario Clouds to Passage, move players to ask what a game is. They suggest a third aesthetic, reflection, which twentieth-century modern art pursued against the immersion of popular forms. Today reflection, too, has become popular entertainment, in Pixar's films, the Scary Movie series and hip-hop's remix, so the spectrum opens into a triangle of catharsis, flow and reflection whose interior is crowded with hybrids. What is disappearing is only the division between elite and popular forms.",
    // Chapters 6 to 8 and the Conclusion (drafts, 2026-11-11, for Jay's approval).
    "Remix in its present form begins with rap and hip-hop, which grew in the 1970s from African American communities that combined the rapper's verbal art with the DJ's sampling of records. Though rappers fought for dominance, the musical foundation of rap, remix, was open to other forms and was absorbed into R&B and pop, so that hip-hop and remix can no longer be isolated as practices. Remix has led not to one style but to a proliferation of styles, and much of this music prefers flow to catharsis: in rap, flow names the interplay of the rapper's rhymes and the beat.",
    "Remix now extends from music to video, images and text, and Lawrence Lessig and others hold that it is the cultural dominant of our time. It ranges from the amateur copying and pasting of social media to the professional productions of JAY-Z and Beyoncé. Amateur video remix, like fan fiction, appropriates a small part of the world of Hollywood film, and it often becomes a meme, constituted by repetition and variation, like the hundreds of Downfall parodies. In remix culture no one cares who began a meme, but those with an economic interest in originality do care.",
    "Originality remains as much an economic and legal issue as an aesthetic one. When Metallica sued Napster in 2000, the band defended the popular modernist assumption that the artist is the sole creator and owner of the work; groups such as Right2Remix now claim that everything is a remix and that the right to remix is a matter of free expression. Because remix appropriates, its creativity is measured by skillful quotation and refashioning, as in postmodern pastiche, so that remix can be called popular postmodernism, though it takes no part in the elite dialogue with modernism. The music industry's lawsuits made commercial sampling costly, but millions of amateur remixers ignore the rules. Even modernists such as Eliot, who praised the poet who steals, held fast to originality.",
    "Remix is far from elite modernism and indifferent to the avant-garde tradition, though political remixes, such as the mashups of George W. Bush's speeches with Lennon's “Imagine,” are claimed as a new avant-garde. Most remix is a celebration of form. Yet remixers such as Girl Talk achieve what the historical avant-garde failed to achieve: their art is integrated into the lives of their audience. Remix violates the modern framework's distinctions between art and craft, original and copy, artist and audience. JAY-Z's Picasso Baby claimed elite status when the hierarchy had already fallen; remix is popular postmodernism, and it is most avant-garde when it is not trying to be.",
    "Remix is itself a mashup of practices, popular and professional, about which every generalization is only partly true. It is playing in the plenitude: at home in a culture of fragments, it draws samples from anywhere, and copyright is an attempt to fence materials off. Remix and originality are creative opposites, and remix reverses the modernist relation between the individual and tradition, emphasizing the wealth of traditions it draws on rather than the individual's contribution to one. It plays in and with many traditions instead of advancing one. And remix culture is flow culture: repetitive, iterative and procedural, from the dance floor to the endless variations of a meme.",
    "Our time traveler from 1960 would be surprised by the culture of quantification: fitness trackers and the Quantified Self, the constant polls of election seasons, economic and box office figures, and endless ranked lists. Mayer-Schönberger and Cukier called this datafication. Bureaucracies have long classified people invisibly, as Bowker and Star showed, but now millions take part knowingly, updating their own database entries and offering data on social media. Our media culture is ambivalent about it: Moneyball against Trouble with the Curve, data journalism against traditional reporting, and a politics in which skepticism of data does not divide neatly along party lines.",
    "Datafication continues the cultural response to mechanization that dates from the Industrial Revolution. In the 1920s and 1930s popular and avant-garde artists, from Chaplin's Modern Times to Léger, Schlemmer and Lang's Metropolis, met the machine with horror or fascination. By HAL in 2001, gears had given way to programs. The computer's operation is better called procedurality than mechanization, as Ian Bogost argues: a programmable machine can become infinitely many machines, and each program reconfigures both the machine and its users, who must become part of the procedure. Nicholas Carr's comparison of Google to Taylorism misses this changed relationship.",
    "Video games are procedural: their worlds are expressed through parameters, the numbers that define a character's powers and health, and through the event loop, which inserts the player into the procedure so seamlessly that she wants it to continue. Games train their players for the procedural structures of digital culture, as iTunes, YouTube and Facebook invite us to parameterize our entertainment and social lives. For Jane McGonigal, collaborative games and alternate reality games can solve the world's problems: games are salvational, as art was for the avant-garde. Christopher Nolan's The Dark Knight, with its Joker as an artist of the alternate reality game, shows the culture's fascination with, and ambivalence about, procedurality.",
    "Simulation games such as the Civilization series and SimCity offer history as a procedural patchwork and invite their players into procedural thinking. Video games take over the scientific idea of simulation without its connection to a theory of the world; they are closer to Baudrillard's simulacra. Their defining quality is replay: like scientific simulations, they can be rerun with different choices, whereas history, as the West has understood it since the eighteenth century, moves in one direction. Players live in a perpetual present whose future can be reimagined, an alternative paradigm to historicism. Lasch saw a waning sense of history in the 1970s; the paradigm of simulation now exists beside the historical sensibility.",
    "Games can still be political: Bogost's procedural rhetoric makes arguments through processes, as in Gonzalo Frasca's September 12, where every missile strike creates more terrorists, and serious games address issues from famine to the Israeli-Palestinian conflict. But simulation, as Espen Aarseth says, is the hermeneutic Other of narrative. Conventional novels and films are strong narratives that move toward resolution; games, when they tell stories at all, offer weak narratives, repetitive and without clear ends. The political ideologies of the past two centuries, Marxism, fascism and liberalism, were strong narratives. For game cultures, simulation replaces history.",
    "Datafication, procedurality and simulation mark one of the great fault lines in our media culture. On one side are communities that see the individual as part of a historical process, prefer print fiction and film, and align with the strong narratives of liberal democracy, socialism or nationalism. On the other are communities that favor procedural interfaces and media, for whom simulation replaces history and who prefer weak political narratives such as libertarianism. To believe that games can solve society's problems is to leave the historical and political dimension out of the procedural equation.",
    "Social media give billions of people the chance to publish themselves, and they work against elitism in the dissemination of ideas. Most people publish themselves: social media are identity media. Critics such as Andrew Keen and Jaron Lanier see this as a cultural and human disaster; enthusiasts see liberation for those who never had a voice. Social media extend to everyone the self-styling that consumer society made available but that only a tiny elite could once publish.",
    "Critics call ours the age of the new narcissism and blame social media, but the complaint is old: Tom Wolfe named the 1970s the Me Decade, and Christopher Lasch described a culture of narcissism and a waning sense of history. Csikszentmihalyi's flow, defined in the same decade, is a secularized version of the Me generation's spirituality and a therapy for individuals in a society without shared values. Flow and catharsis, weak and strong narrative, are interrelated spectrums that now extend into social and political life, shaping different kinds of identity and of politics.",
    "danah boyd argues that teenagers integrate social media into their social lives rather than withdrawing from them, while Sherry Turkle sees us expecting more from technology and less from each other. Each Facebook page is a channel for presenting a face to a networked audience, with its own risks. Facebook redefines friendship as listening and telling one's story in fragments. The identity it constructs is identity as remix: a flow of small, often unrelated elements, adapted to different audiences, as boyd's story of a young applicant's MySpace page shows.",
    "Being on Facebook requires a storytelling very different from Hollywood's. Aaron Sorkin's The Social Network explains Facebook in cathartic Hollywood terms, through Zuckerberg's flawed humanity, but the stories in a News Feed are weak narratives, repetitive, fragmentary and without an ending. Social media are self-centered: each platform invites users to tell their own stories, and the whole network is a vast selfie. Social networking is flow punctuated by catharsis, never meant to end. Twitter suits weak narrative and self-presentation, as Donald Trump's tweets show.",
    "Trump's success in 2016 showed how self-presentation and politics merge in digital media. His identity politics differs from the left's, a cathartic story of injustice with an expected triumph, and from the alt-right's inversion of it: it centers on one individual, himself. The profiling and targeting by which Facebook and Google serve advertisers also express the proceduralization of culture, and the filters users want for navigating the plenitude produce filter bubbles, as Eli Pariser and the Wall Street Journal's Blue Feed, Red Feed showed. Digital media intensify a long-standing division of America into separate information communities.",
    "Mobile and social media have long been used for collective action: the flash mob, a popular modernist performance; Rheingold's smart mobs; the Arab Spring, whose authoritarian governments feared social media; Occupy. Clay Shirky sees a marriage of technology and human generosity, but such communities are more like temporary liaisons. Like McGonigal's alternate reality games, these actions are intense but short-lived, their narratives simple or fragmented, and particular expressions such as #MeToo appear and fade. Social media bring weak narrative and flow both to individual identity and to collective engagement.",
    "Anonymous grew from 4chan, an anonymous imageboard of endlessly replaced images and the weakest of narratives. From Project Chanology against the Church of Scientology to attacks on companies that blocked donations to WikiLeaks and support for the Arab Spring, its young members drifted from pranks into hacktivism without a political program. The distributed denial-of-service attack is the perfect instrument of a politics of flow, and its ideology, if any, was that information wants to be free. WikiLeaks under Julian Assange practiced disclosure for disclosure's sake; personal and political motives blurred, as in the 2016 release of Democratic emails.",
    "American politics is a struggle between an older narrative politics and a politics of flow. The parties have grown more ideologically coherent and polarized, yet their narratives are less consistent, as the Tea Party and Hochschild's deep story show. Trump's campaign in 2016 broke both parties' narratives into pieces to be reshuffled, offering emotional story fragments in short tweets, against the Clinton campaign's procedural and cathartic narrative. Trump is the latest of the populist candidates without traditional qualifications, the political version of the breakdown of elitism in art, and social media and fake news provide the matrix for his politics of flow.",
    "No single technology or practice is likely to dominate our media future, despite forecasts in the popular modernist tradition of McLuhan. Each dichotomy is a spectrum, and the aesthetics on the traditional side, catharsis, the single-authored book, a half-datafied society, are flourishing beside the new ones. Multiplicity is our future, and its wealth of opportunities for self-expression more than compensates for the loss of a single cultural center. But in politics we cannot retreat to our own corners: decisions are collective, and democracies grounded in a politics of catharsis may not function under a politics of flow.",
  ],

  // H-003: replaces "Current section" in the system prompt.
  sectionLabel: 'Now under discussion',

  // H-005: citations appear as numbered notes; the full references come from this file.
  citationMarkers: true,
  referencesFile: path.join(__dirname, 'source_texts', 'references.json'),

  // H-003, extended 2026-10-31: works the text may cite by name, one file per section (null: none). Ordinary readings only.
  // H-018: one checked list of videos, images and web pages per section
  // (source_texts/media-lists/section-N.json, kept with npm run media).
  mediaListsDir: path.join(__dirname, 'source_texts', 'media-lists'),
  libraryListsDir: path.join(__dirname, 'source_texts', 'library-lists'),
  libraryLists: ['section-1.md', 'section-2.md', 'section-3.md', 'section-4.md', 'section-5.md', 'section-6.md', 'section-7.md',
    // H-014: chapter 2 (Jay, 2026-11-05)
    'section-8.md', 'section-9.md', 'section-10.md', 'section-11.md', 'section-12.md', 'section-13.md', 'section-14.md', 'section-15.md',
    // H-015: chapter 3 (Jay, 2026-11-05)
    'section-16.md', 'section-17.md', 'section-18.md',
    // Chapter 4 (2026-11-11).
    'section-19.md', 'section-20.md', 'section-21.md', 'section-22.md', 'section-23.md',
    // Chapter 5 (2026-11-11).
    'section-24.md', 'section-25.md', 'section-26.md', 'section-27.md', 'section-28.md', 'section-29.md',
    // Chapters 6 to 8 and the Conclusion (drafts, 2026-11-11, for Jay's review).
    'section-30.md', 'section-31.md', 'section-32.md', 'section-33.md', 'section-34.md',
    'section-35.md', 'section-36.md', 'section-37.md', 'section-38.md', 'section-39.md', 'section-40.md',
    'section-41.md', 'section-42.md', 'section-43.md', 'section-44.md', 'section-45.md', 'section-46.md', 'section-47.md', 'section-48.md',
    'section-49.md'],
  libraryPreamble: `WORKS THAT MAY BE CITED BY NAME

Other writers are evidence. Below are books and articles you have read, each with its id in square brackets, what it says and its pages. When you draw on one, mention it as its entry says and put a marker straight after the point it supports: [[CITE:id]], or [[CITE:id|pages]] with pages taken from its entry, as in "Bürger argued that shock, once the public expects it, is consumed [[CITE:burger-1984|80–81]]." The marker becomes a numbered note that holds the full reference, so the sentence carries at most the writer's name and nothing more of the citation. Rely on each work no further than what is written of it here. Their views stay theirs, attributed and weighed, apart from your own voice. When a writer reached a conclusion from the opposite side, say so. Bring a writer in only when the work bears on the reader's point; most replies need none, two notes in a reply are plenty, and a Return turn seldom needs more than one.`,

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
