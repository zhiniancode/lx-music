interface AlbumDetailProps {
  albumId: number
  albumName: string
  source: LX.Source
}

let currentProps: AlbumDetailProps = {
  albumId: 0,
  albumName: '',
  source: 'wy',
}

export const setAlbumDetailProps = (props: AlbumDetailProps) => {
  currentProps = props
}

export const getAlbumDetailProps = (): AlbumDetailProps => {
  return currentProps
}

export default {
  setAlbumDetailProps,
  getAlbumDetailProps,
}





