// The platinum roadmap: three stages built from the official descriptions —
// which story chapters and missions, which collectibles and counts, in what order.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story',
    time: '60–80 hours · Chapters 1–5',
    points: [
      'Finish all five chapters and the final mission, Starting From Zero — the chapter and mission trophies pop as you go.',
      'Do Lucia’s balcony meditation in Chapter 1, the morning after Down to Earth. It is the only possibly missable trophy step in the game.',
      'Scan vehicles with the WAiNK app and study animals with binoculars as you travel; both count toward 100% later.',
      'Take Andy’s, Kenton’s, Billy’s, Randy’s and Tyrone’s calls as they come — their questlines start in the story but finish any time.',
    ],
  },
  {
    stage: 2,
    title: 'Stage 2 — The 100% checklist',
    time: 'About 100 hours · After the story',
    points: [
      'Open Progress > Stats > 100% Completion and work the list: all 39 gang operations, 22 bank jobs, 8 bank vaults, 33 underwater discoveries, 42 shooting-range gold medals, 14 Top Fun locations, 15 of Bret’s target decks.',
      'Grind the counts: 300 of 397 stunts, 200 of 277 vehicles scanned, 100 of 255 animals studied, 100 WAiNK scans, 15 of 18 card sets, 15 of 18 meditations, 100 of 125 flamingos, 70 of 80 challenges.',
      'Robberies pay for the rest: 8 garages for Little Boxes, $250,000 of marked bills for Dime on the Dollar, and the partner trophies Hot Together and Retail Therapy.',
      'Nothing on the checklist is missable — everything is still open in free roam.',
    ],
  },
  {
    stage: 3,
    title: 'Stage 3 — Cleanup and platinum',
    time: 'About 10 hours · Free roam',
    points: [
      'Finish 8 qualifying Strangers & Freaks strands — Kirk, Kyle, Yago and Pilot Pete count; the named questlines do not.',
      'Close out the character questlines (Andy, Kenton, Billy, Randy, Tyrone) and Bret’s hunts if anything is left.',
      'Mop up the odd ones: the UFO easter egg (The Truth Is Out There), the Little Cuba payday loan store (Bad Luck, I Guess), and any combat or driving trophies still open.',
      'A Long Road (100% completion) lands, then Vice Got a Price! — the platinum.',
    ],
  },
];

/** Render the three roadmap stage cards into the given container. */
export function renderRoadmap(container, trophies) {
  container.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const card = document.createElement('article');
    card.className = 'stage-card';
    const heading = document.createElement('h3');
    heading.textContent = stage.title;
    const time = document.createElement('p');
    time.className = 'stage-time';
    time.textContent = stage.time;
    const list = document.createElement('ul');
    for (const point of stage.points) {
      const item = document.createElement('li');
      item.textContent = point;
      list.append(item);
    }
    const count = document.createElement('p');
    count.className = 'stage-count';
    const stageTrophies = trophies.filter((trophy) => trophy.stage === stage.stage).length;
    count.textContent = `${stageTrophies} of the 55 trophies belong to this stage.`;
    card.append(heading, time, list, count);
    container.append(card);
  }
}
