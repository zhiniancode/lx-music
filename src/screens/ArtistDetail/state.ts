interface ArtistDetailProps {
  artistId: number
  artistName: string
}

let currentProps: ArtistDetailProps = {
  artistId: 0,
  artistName: '',
}

export const setArtistDetailProps = (props: ArtistDetailProps) => {
  currentProps = props
}

export const getArtistDetailProps = (): ArtistDetailProps => {
  return currentProps
}

export default {
  setArtistDetailProps,
  getArtistDetailProps,
}

