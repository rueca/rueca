/* Generation settings. The composer renders the prompt / model / aspect / batch rows
   itself; the Create tab renders `sampling` and `refine` through the kit Inspector. Undo, presets
   and A/B cover all of it. */
import { defineSchema, folder, p, createParams } from '@kit'
import { MODELS, ASPECTS } from '../engine/models'

/* The prompt lives in its own store so settings presets and A/B never overwrite what you typed. */
export const promptSchema = defineSchema({
  prompt: folder('Prompt', {
    prompt: p.text('', { multiline: true, placeholder: 'Describe an image…' }),
    negative: p.text('', { label: 'Negative prompt', placeholder: 'What to leave out' }),
  }),
})
export const prompt = createParams(promptSchema, { id: 'generate-prompt', url: false })

export const schema = defineSchema({
  model: folder('Model', {
    model: p.select('lumen-xl', MODELS.map((m) => ({ value: m.id, label: m.name, hint: m.blurb }))),
    aspect: p.select('4:5', ASPECTS.map((a) => ({ value: a.id, label: a.id }))),
    batch: p.number(4, { min: 1, max: 4, step: 1, hint: 'Images per run.' }),
  }),
  sampling: folder('Sampling', {
    steps: p.number(30, { min: 1, max: 80, step: 1, hint: 'Denoising steps. Fewer is faster but leaves noise; each model has a sweet spot.' }),
    guidance: p.number(7, { min: 1, max: 20, step: 0.5, label: 'Guidance', hint: 'How literally to follow the prompt (CFG). Past ~14 colours start to burn.' }),
    lockSeed: p.boolean(false, { label: 'Lock seed', hint: 'Off: every run picks a new seed. On: reuse the seed below — change one word and compare.' }),
    seed: p.seed(424242, { when: (v) => v.lockSeed }),
  }),
  refine: folder('Variations & upscale', {
    varStrength: p.number(0.25, { min: 0.05, max: 0.9, step: 0.05, label: 'Variation', fmt: (v) => v.toFixed(2), hint: 'How far Variations wander from the source image: 0.15 subtle, 0.4 medium, 0.7 strong.' }),
    upscaleMode: p.select('subtle', [{ value: 'subtle', label: 'Subtle' }, { value: 'creative', label: 'Creative' }], { label: 'Upscale', hint: 'Creative invents a little extra texture on the way up.' }),
  }),
})

export const params = createParams(schema, {
  id: 'generate',
  url: false,
  presets: [
    { name: 'Draft', values: { model: 'lumen-turbo', steps: 6, guidance: 2, batch: 4 } },
    { name: 'Balanced', values: { model: 'lumen-xl', steps: 30, guidance: 7 } },
    { name: 'Final photo', values: { model: 'photon', steps: 40, guidance: 6, batch: 2 } },
    { name: 'Print run', values: { model: 'riso', steps: 24, guidance: 8, aspect: '2:3' } },
  ],
})
export type V = ReturnType<typeof params.values>
