// @flow

import { Navigation } from 'react-native-navigation'

import {
  LoadingScreen,
  LoginScreen,
  Home,
  Search,
  PlayDetail,
  SonglistDetail,
  ArtistDetail,
  AlbumDetail,
  Comment,
  // Setting,
} from '@/screens'
import { Provider } from '@/store/Provider'

import {
  LOADING_SCREEN,
  LOGIN_SCREEN,
  HOME_SCREEN,
  SEARCH_SCREEN,
  PLAY_DETAIL_SCREEN,
  SONGLIST_DETAIL_SCREEN,
  ARTIST_DETAIL_SCREEN,
  ALBUM_DETAIL_SCREEN,
  COMMENT_SCREEN,
  VERSION_MODAL,
  PACT_MODAL,
  SYNC_MODE_MODAL,
  // SETTING_SCREEN,
} from './screenNames'
import VersionModal from './components/VersionModal'
import PactModal from './components/PactModal'
import SyncModeModal from './components/SyncModeModal'

function WrappedComponent(Component: any) {
  return function inject(props: Record<string, any>) {
    const EnhancedComponent = () => (
      <Provider>
        <Component
          {...props}
        />
      </Provider>
    )

    return <EnhancedComponent />
  }
}

export default () => {
  Navigation.registerComponent(LOADING_SCREEN, () => WrappedComponent(LoadingScreen))
  Navigation.registerComponent(LOGIN_SCREEN, () => WrappedComponent(LoginScreen))
  Navigation.registerComponent(HOME_SCREEN, () => WrappedComponent(Home))
  Navigation.registerComponent(SEARCH_SCREEN, () => WrappedComponent(Search))
  Navigation.registerComponent(PLAY_DETAIL_SCREEN, () => WrappedComponent(PlayDetail))
  Navigation.registerComponent(SONGLIST_DETAIL_SCREEN, () => WrappedComponent(SonglistDetail))
  Navigation.registerComponent(ARTIST_DETAIL_SCREEN, () => WrappedComponent(ArtistDetail))
  Navigation.registerComponent(ALBUM_DETAIL_SCREEN, () => WrappedComponent(AlbumDetail))
  Navigation.registerComponent(COMMENT_SCREEN, () => WrappedComponent(Comment))
  Navigation.registerComponent(VERSION_MODAL, () => WrappedComponent(VersionModal))
  Navigation.registerComponent(PACT_MODAL, () => WrappedComponent(PactModal))
  Navigation.registerComponent(SYNC_MODE_MODAL, () => WrappedComponent(SyncModeModal))
  // Navigation.registerComponent(SETTING_SCREEN, () => WrappedComponent(Setting))

  console.info('All screens have been registered...')
}
