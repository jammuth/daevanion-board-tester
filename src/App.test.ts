import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import { buildShareHash } from './lib/share'
import { SCREENSHOT_BOARD } from './lib/testing/asciiBoard'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  it('paints tiles with the selected brush', async () => {
    const wrapper = mount(App)
    await wrapper.find('[role="radio"]:nth-child(4)').trigger('click')
    await wrapper.find('[data-testid="tile-0"]').trigger('click')
    expect(wrapper.find('[data-testid="tile-0"]').classes()).toContain('bg-blue-600')
  })

  it('calculates a path and shows the total cost', async () => {
    const wrapper = mount(App)
    // Tiles start grey, so a skill two above the start is reached through grey tile 49.
    await wrapper.find('[role="radio"]:nth-child(4)').trigger('click')
    await wrapper.find('[data-testid="tile-38"]').trigger('click')
    await wrapper.find('button.bg-amber-300.font-semibold').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="total-cost"]').text()).toBe('4')
    expect(wrapper.find('[data-testid="result-quality"]').text()).toContain('Optimal')
    expect(wrapper.find('[data-testid="tile-49"]').classes()).toContain('ring-yellow-300')
  })

  it('starts with every tile grey except the start', () => {
    const wrapper = mount(App)
    const tiles = wrapper.findAll('[data-testid^="tile-"]')
    expect(tiles.filter((t) => t.classes().includes('bg-slate-500'))).toHaveLength(120)
  })

  it('reports unreachable targets', async () => {
    const wrapper = mount(App)
    await wrapper.find('[role="radio"]:nth-child(1)').trigger('click')
    await wrapper.find('[data-testid="tile-1"]').trigger('click')
    await wrapper.find('[data-testid="tile-11"]').trigger('click')
    await wrapper.find('[role="radio"]:nth-child(5)').trigger('click')
    await wrapper.find('[data-testid="tile-0"]').trigger('click')
    await wrapper.find('button.bg-amber-300.font-semibold').trigger('click')
    expect(wrapper.find('[data-testid="unreachable-message"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tile-0"]').classes()).toContain('ring-red-500')
  })

  it('asks before clearing a painted board when switching size', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mount(App)
    await wrapper.find('[role="radio"]:nth-child(1)').trigger('click')
    await wrapper.find('[data-testid="tile-0"]').trigger('click')
    const thirteen = wrapper.findAll('[aria-label="Board size"] button')[1]!

    await thirteen.trigger('click')
    expect(confirmSpy).toHaveBeenCalledOnce()
    expect(wrapper.findAll('[data-testid^="tile-"]')).toHaveLength(121)

    confirmSpy.mockReturnValue(true)
    await thirteen.trigger('click')
    expect(wrapper.findAll('[data-testid^="tile-"]')).toHaveLength(169)
  })

  it('opens a shared board from the URL', () => {
    window.location.hash = buildShareHash({ title: 'Shared build', board: SCREENSHOT_BOARD })
    const wrapper = mount(App)
    expect(wrapper.find<HTMLInputElement>('#board-title').element.value).toBe('Shared build')
    expect(wrapper.find('[data-testid="tile-0"]').classes()).toContain('bg-orange-500')
    expect(window.location.hash).toBe('')
  })
})
