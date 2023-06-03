export class TalkTypeError extends Error {
  constructor(message: string) {
    super(`TalkType Error: ${message}`)
    this.name = 'TalkType Error'
  }
}
