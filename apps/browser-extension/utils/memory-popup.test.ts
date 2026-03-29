import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryPopup, showMemoryPopup, hideMemoryPopup, toggleMemoryPopup } from './memory-popup';

describe('memory-popup utilities', () => {
    let popup: HTMLElement;

    beforeEach(() => {
        popup = document.createElement('div');
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('showMemoryPopup', () => {
        it('should show popup and set timeout to hide it after 10 seconds', () => {
            showMemoryPopup(popup);
            expect(popup.style.display).toBe('block');

            // Fast-forward 10 seconds
            vi.advanceTimersByTime(10000);

            expect(popup.style.display).toBe('none');
        });

        it('should not hide popup if display was changed from block during timeout', () => {
            showMemoryPopup(popup);
            expect(popup.style.display).toBe('block');

            // Change display manually before timeout
            popup.style.display = 'flex';

            // Fast-forward 10 seconds
            vi.advanceTimersByTime(10000);

            expect(popup.style.display).toBe('flex'); // Should remain flex
        });
    });

    describe('hideMemoryPopup', () => {
        it('should hide popup', () => {
            popup.style.display = 'block';
            hideMemoryPopup(popup);
            expect(popup.style.display).toBe('none');
        });
    });

    describe('toggleMemoryPopup', () => {
        it('should show popup if display is "none"', () => {
            popup.style.display = 'none';
            toggleMemoryPopup(popup);
            expect(popup.style.display).toBe('block');
        });

        it('should show popup if display is empty string ""', () => {
            popup.style.display = '';
            toggleMemoryPopup(popup);
            expect(popup.style.display).toBe('block');
        });

        it('should hide popup if display is "block"', () => {
            popup.style.display = 'block';
            toggleMemoryPopup(popup);
            expect(popup.style.display).toBe('none');
        });

        it('should correctly toggle state multiple times', () => {
            popup.style.display = 'none';

            toggleMemoryPopup(popup); // Should be block
            expect(popup.style.display).toBe('block');

            toggleMemoryPopup(popup); // Should be none
            expect(popup.style.display).toBe('none');

            toggleMemoryPopup(popup); // Should be block again
            expect(popup.style.display).toBe('block');
        });
    });

    describe('createMemoryPopup', () => {
        it('should create a popup element with correct styling and content', () => {
            const config = {
                memoriesData: 'Test memory content',
                onClose: vi.fn(),
            };

            const createdPopup = createMemoryPopup(config);

            expect(createdPopup.tagName).toBe('DIV');
            expect(createdPopup.textContent).toContain('INCLUDED MEMORIES');
            expect(createdPopup.textContent).toContain('Test memory content');
        });

        it('should attach close button handler', () => {
            const onClose = vi.fn();
            const config = {
                memoriesData: 'Test memory content',
                onClose,
            };

            const createdPopup = createMemoryPopup(config);
            const closeBtn = createdPopup.querySelector('#close-popup-btn') as HTMLElement;

            expect(closeBtn).not.toBeNull();
            closeBtn?.click();
            expect(onClose).toHaveBeenCalled();
        });

        it('should include remove button when onRemove is provided', () => {
            const onRemove = vi.fn();
            const config = {
                memoriesData: 'Test memory content',
                onClose: vi.fn(),
                onRemove,
            };

            const createdPopup = createMemoryPopup(config);
            const removeBtn = createdPopup.querySelector('#remove-memories-btn') as HTMLElement;

            expect(removeBtn).not.toBeNull();
            removeBtn?.click();
            expect(onRemove).toHaveBeenCalled();
        });

        it('should not include remove button when onRemove is not provided', () => {
            const config = {
                memoriesData: 'Test memory content',
                onClose: vi.fn(),
            };

            const createdPopup = createMemoryPopup(config);
            const removeBtn = createdPopup.querySelector('#remove-memories-btn') as HTMLElement;

            expect(removeBtn).toBeNull();
        });
    });
});
