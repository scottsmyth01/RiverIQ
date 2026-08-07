export function openSupportChat({ topic = '', message = '', metadata = {}, sendOnOpen = false } = {}) {
  window.dispatchEvent(
    new CustomEvent('riveriq:support-chat:open', {
      detail: {
        topic,
        message,
        metadata,
        sendOnOpen,
      },
    }),
  );
}
