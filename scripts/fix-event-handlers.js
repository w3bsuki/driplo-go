import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Mapping of old event handlers to new ones
const eventMap = {
  'on:click': 'onclick',
  'on:focus': 'onfocus',
  'on:blur': 'onblur',
  'on:mouseenter': 'onmouseenter',
  'on:mouseleave': 'onmouseleave',
  'on:keydown': 'onkeydown',
  'on:keyup': 'onkeyup',
  'on:change': 'onchange',
  'on:input': 'oninput',
  'on:submit': 'onsubmit',
  'on:reset': 'onreset',
  'on:scroll': 'onscroll',
  'on:load': 'onload',
  'on:error': 'onerror',
  'on:resize': 'onresize',
  'on:contextmenu': 'oncontextmenu',
  'on:dblclick': 'ondblclick',
  'on:dragstart': 'ondragstart',
  'on:dragend': 'ondragend',
  'on:dragover': 'ondragover',
  'on:drop': 'ondrop',
  'on:touchstart': 'ontouchstart',
  'on:touchend': 'ontouchend',
  'on:touchmove': 'ontouchmove',
  'on:animationend': 'onanimationend',
  'on:transitionend': 'ontransitionend'
};

async function fixEventHandlers() {
  // Find all Svelte files
  const files = await glob('src/**/*.svelte');
  
  let totalFixed = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let newContent = content;
    let changes = 0;
    
    // Replace each deprecated event handler
    for (const [oldEvent, newEvent] of Object.entries(eventMap)) {
      const regex = new RegExp(`\\b${oldEvent.replace(':', '\\:')}(?=\\s*=)`, 'g');
      const matches = newContent.match(regex);
      if (matches) {
        changes += matches.length;
        newContent = newContent.replace(regex, newEvent);
      }
    }
    
    if (changes > 0) {
      fs.writeFileSync(file, newContent);
      console.log(`Fixed ${changes} event handlers in ${file}`);
      totalFixed += changes;
    }
  }
  
  console.log(`\nTotal event handlers fixed: ${totalFixed}`);
}

fixEventHandlers().catch(console.error);