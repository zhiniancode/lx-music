import { showArtistDetailScreen } from '@/navigation/navigation'
import commonState from '@/store/common/state'

export const navigateToArtistDetail = (artistId: number, artistName: string) => {
  showArtistDetailScreen(commonState.componentIds.home!, artistId, artistName)
}

