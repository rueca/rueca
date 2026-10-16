/* Preview: one focused, live instance in a resizable viewport. */
import { Smartphone, Tablet, Monitor, Sun, Moon } from 'lucide-react'
import { Segmented, useStudio } from '@kit'
import { ViewportFrame, type ViewportPreset } from '@kit/stage/ViewportFrame'
import { useUI, setUI } from '../ui'
import { LabRoot, Instance } from './Instance'

export const VIEWPORTS: ViewportPreset[] = [
  { label: 'Mobile', width: 375, icon: Smartphone },
  { label: 'Tablet', width: 768, icon: Tablet },
  { label: 'Desktop', width: 1280, icon: Monitor },
]

export function Preview() {
  const comp = useUI((s) => s.comp)
  const width = useUI((s) => s.width)
  const theme = useUI((s) => s.previewTheme)
  const { present } = useStudio()
  return (
    <ViewportFrame
      // ⌘\ present: keep the frame at its width, hide the viewport bar, ruler and resize handles (break-it F3).
      // Kit gap: ViewportFrame could take a `chrome={false}` prop instead of these structural selectors.
      className={present ? '[&>div:first-child]:hidden [&_.mb-2.h-5]:invisible [&_[role=slider]]:hidden' : undefined}
      width={width}
      onWidth={(w) => setUI({ width: w })}
      presets={VIEWPORTS}
      min={280}
      max={1600}
      minHeight={480}
      toolbar={
        <div className="w-[64px]">
          <Segmented iconOnly value={theme} onChange={(t) => setUI({ previewTheme: t as 'light' | 'dark' })} label="Preview theme"
            options={[{ value: 'light', label: 'Light', icon: Sun, hint: 'Preview light (D)' }, { value: 'dark', label: 'Dark', icon: Moon, hint: 'Preview dark (D)' }]} />
        </div>
      }
    >
      <LabRoot theme={theme} className="flex min-h-[480px] items-center justify-center p-8">
        <div className="flex w-full justify-center" style={{ maxWidth: comp === 'card' ? 680 : comp === 'input' ? 360 : undefined }}>
          <Instance comp={comp} />
        </div>
      </LabRoot>
    </ViewportFrame>
  )
}
