import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import Web3 from 'web3';
import ReactGA from 'react-ga';
import config from '../../constants/config.json';
import Routes from '../../routes';
import Login from '../../components/Login/Login';
import { loginMetamask, fetchEthfinexData } from '../../actions/accountActions';
import './App.scss';

class App extends Component {
  constructor() {
    super();
    this.state = {
      open: false,
    };
  }

  componentWillMount() {
    // Set default provider & silently attempt to login with Metamask (don't display errors)
    window._web3 = new Web3(config.providerUrl);
    this.props.loginMetamask(true);
    this.props.fetchEthfinexData();
    ReactGA.pageview(this.props.location.pathname);
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      ReactGA.pageview(this.props.location.pathname);
    }
  }

  clickLinkHandler = () => {
    this.setState({ open: false });
  };

  render() {
    const { location } = this.props;
    const isLanding = location.pathname === '/';

    return (
      <div>
        <div className={`notification-wrapper ${this.props.showNotif ? 'active' : ''}`}>
          <div className={`notification-inner-wrapper ${this.props.notifType}`}>
            {this.props.notifMessage}
          </div>
        </div>
        <nav className={`${this.state.open ? 'open' : ''}`}>
          <a
            target="_blank"
            href="https://www.deversifi.com"
            rel="noopener noreferrer"
            className="logo"
          >
            <img src="/images/new-logo-wh.svg" alt="" height="40" />
          </a>

          <div className="menu-opener-wrapper">
            <a onClick={() => this.setState({ open: !this.state.open })}>|||</a>
          </div>
          <div className="nav-links">
            <Link to="/" onClick={this.clickLinkHandler}>
              Home
            </Link>
            <Link to="/traderboard" onClick={this.clickLinkHandler}>
              Traderboard
            </Link>
            <Link to="/whitepaper">
              Whitepaper
            </Link>
            <div className="dropdown-wrapper">
              <a>Token Listings</a>
              <div>
                <Link onClick={this.clickLinkHandler} to="/tokens">
                  About
                </Link>
                <Link onClick={this.clickLinkHandler} to="/token-leaderboard">
                  Leaderboard
                </Link>
                <Link onClick={this.clickLinkHandler} to="/token-pool">
                  The Pool
                </Link>
              </div>
            </div>
            <div className="dropdown-wrapper">
              <a>Proposals</a>
              <div>
                <Link onClick={this.clickLinkHandler} to="/delegate-votes">
                  Delegate Votes
                </Link>
                <Link onClick={this.clickLinkHandler} to="/proposals">
                  All Proposals
                </Link>
                <Link onClick={this.clickLinkHandler} to="/pending">
                  Pending Proposals
                </Link>
                <Link onClick={this.clickLinkHandler} to="/submit">
                  Submit a Proposal
                </Link>
              </div>
            </div>
            <Link onClick={this.clickLinkHandler} to="/faq">
              FAQ
            </Link>
          </div>
        </nav>

        <Routes />

        {isLanding ? null : (
          <>
            <Login />
            <footer>
              <div className="container">
                <div className="logo-wrapper">
                  <img src="/images/new-logo-wh.svg" alt="" />
                  <span>Nectar.community</span>
                </div>
                <p className="copyright">Copyright DeversiFi</p>
              </div>
            </footer>
          </>
        )}
      </div>
    );
  }
}

App.propTypes = {
  showNotif: PropTypes.bool.isRequired,
  notifMessage: PropTypes.string.isRequired,
  notifType: PropTypes.string.isRequired,
  loginMetamask: PropTypes.func.isRequired,
  fetchEthfinexData: PropTypes.func.isRequired,
  account: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

const mapStateToProps = state => ({
  showNotif: state.notification.displayed,
  notifMessage: state.notification.message,
  notifType: state.notification.type,
  account: state.account.account,
  isAdmin: state.account.isAdmin,
});

export default connect(
  mapStateToProps,
  {
    loginMetamask,
    fetchEthfinexData,
  }
)(withRouter(App));
