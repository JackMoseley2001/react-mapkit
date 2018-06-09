// @flow
/* global mapkit */

import type MapKitType, { MapKitFeatureVisibility, MapKitMapType } from 'mapkit'
declare var mapkit: MapKitType

import * as React from 'react'
import load from 'little-loader'
import invariant from 'invariant'

import ErrorBoundry from './ErrorBoundry'

type MapKitCoordinate = [number, number]

type Location = MapKitCoordinate

type PaddingType =
  | number
  | { top?: number, bottom?: number, left?: number, right?: number }

type Props = {
  callbackUrl?: string,
  token?: string,

  mapType: MapKitMapType,
  padding: PaddingType,
  showsCompass: MapKitFeatureVisibility,
  showsMapTypeControl: boolean,
  showsZoomControl: boolean,
  showsUserLocationControl: boolean,
  showsPointsOfInterest: boolean,
  showsScale: MapKitFeatureVisibility,
  tintColor?: string,

  center?: MapKitCoordinate,
  animateCenterChange: boolean,

  isRotationEnabled: boolean,
  isScrollEnabled: boolean,
  isZoomEnabled: boolean,

  showsUserLocationControl: boolean,
}

type State = {
  mapKitIsReady: boolean,
}

const defaultPropsErrorText =
  "Either a `callbackUrl` or `token` is required for the `MapKit` component. One of these props must be set on init and can't be updated after the component is setup."

class MapKit extends React.Component<Props, State> {
  map = null

  static defaultProps = {
    mapType: 'standard',
    padding: 0,
    showsCompass: 'adaptive',
    showsMapTypeControl: true,
    showsZoomControl: true,
    showsUserLocationControl: false,
    showsPointsOfInterest: true,
    showsScale: 'hidden',
    animateCenterChange: true,
    isRotationEnabled: true,
    isScrollEnabled: true,
    isZoomEnabled: true,
  }

  state = {
    mapKitIsReady: false,
  }

  constructor(props: Props) {
    super(props)

    this.checkProps(props)

    load(
      'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js',
      () => this.initMap(props),
      this,
    )
  }

  initMap = (props: Props) => {
    mapkit.init({
      authorizationCallback: (done) => {
        props.callbackUrl
          ? fetch(props.callbackUrl)
              .then((res) => res.text())
              .then(done)
          : done(props.token)
      },
    })

    this.map = new mapkit.Map('map')

    this.updateMapProps(props)

    this.setState({ mapKitIsReady: true })
  }

  checkProps = (props: Props) => {
    invariant(props.callbackUrl || props.token, defaultPropsErrorText)
  }

  updateMapProps = (props: Props) => {
    // Update map based on props
    this.map.showsMapTypeControl = props.showsMapTypeControl
    this.map.mapType = props.mapType

    this.map.padding = this.createPadding(props.padding)
    this.map.showsCompass = props.showsCompass
    this.map.showsMapTypeControl = props.showsMapTypeControl
    this.map.showsZoomControl = props.showsZoomControl
    this.map.showsUserLocationControl = props.showsUserLocationControl
    this.map.showsPointsOfInterest = props.showsPointsOfInterest
    this.map.showsScale = props.showsScale
    this.map.tintColor = props.tintColor
    this.map.isRotationEnabled = props.isRotationEnabled
    this.map.isScrollEnabled = props.isScrollEnabled
    this.map.isZoomEnabled = props.isZoomEnabled

    if (props.center) {
      this.map.setCenterAnimated(
        this.createCoordinate(props.center),
        props.animateCenterChange,
      )
    }
  }

  createPadding = (padding: PaddingType) => {
    return new mapkit.Padding(
      typeof padding === 'number'
        ? {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding,
          }
        : { top: 0, right: 0, bottom: 0, left: 0, ...padding },
    )
  }

  createCoordinate = (location: Location) => {
    return new mapkit.Coordinate(location[0], location[1])
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    // make sure we have at least one init prop
    this.checkProps(nextProps)

    // if our init props have changed, throw an error, we currently don't re-init the map
    if (
      this.props.token !== nextProps.token ||
      this.props.callbackUrl !== nextProps.callbackUrl
    ) {
      invariant(false, defaultPropsErrorText)
    }

    // for a lot of prop changes we're just making calls to mapKit so we have no need to re-render
    let ComponentShouldUpdate = false

    // might be needed when we start adding markers, but for now not a thing we do
    // if (this.props.children !== nextProps.children) {
    //   ComponentShouldUpdate = true
    // }

    if (this.state.mapKitIsReady) {
      this.updateMapProps(nextProps)
    }

    return ComponentShouldUpdate
  }

  render() {
    const {
      callbackUrl,
      token,

      mapType,
      padding,
      showsCompass,
      showsMapTypeControl,
      showsZoomControl,
      showsUserLocationControl,
      showsPointsOfInterest,
      showsScale,
      tintColor,

      animateCenterChange,
      center,

      isRotationEnabled,
      isScrollEnabled,
      isZoomEnabled,

      ...otherProps
    } = this.props

    return <div id="map" {...otherProps} />
  }
}

export default (props: Props) => (
  <ErrorBoundry errorText={defaultPropsErrorText}>
    <MapKit {...props} />
  </ErrorBoundry>
)
