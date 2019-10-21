import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getProposals } from '../../actions/proposalActions';
import ProposalCountdown from '../ProposalCountdown/ProposalCountdown';
import './AllProposals.scss';

class AllProposals extends Component {
  componentDidMount() {
    this.props.getProposals();
  }

  render() {
    return (
      <div className="all-proposals">
        <div className="container">
          <h1>All Proposals</h1>
          <p className="notice">
            All proposals require a minimum quorum of 50 million votes to be reached. <br />
            These proposals are advisory in nature and the outcomes are not considered binding
          </p>
        </div>
        {this.props.proposals.filter(p => p._active).length !== 0 && (
          <div>
            <div className="active-section">
              <div className="container">
                {this.props.proposals
                  .filter(p => p._active)
                  .map(proposal => (
                    <div key={proposal._token} className="proposal-wrapper">
                      <ProposalCountdown endTime={proposal.endTime} />

                      <div className="details-wrapper">
                        <Link className="title" to={`/proposal/${proposal.id}`}>
                          {proposal.title}
                        </Link>
                        <p className="description">{proposal.description}</p>
                        <Link className="vote-wrapper" to={`/proposal/${proposal.id}`}>
                          VOTE
                        </Link>
                      </div>

                      <div className="results-wrapper">
                        <div className="yes">
                          <span className="word">yes</span>
                          <div className="bar">
                            <div
                              className="bar-yes"
                              style={{ width: `${proposal.yesPercentage}%` }}
                            />
                          </div>
                          <div className="number">{`${Math.floor(proposal.yesPercentage)}`}</div>
                          <div className="votes-number">{proposal.totalYes} VT</div>
                        </div>
                        <div className="no">
                          <span className="word">no</span>
                          <div className="number">{`${Math.floor(proposal.noPercentage)}`}</div>
                          <div className="votes-number">{proposal.totalNo} VT</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="waves reverse" />
          </div>
        )}

        {!this.props.proposals.filter(p => p._active).length && (
          <div className="container">
            <div className="no-proposals">No proposals are currently active.</div>
          </div>
        )}

        <div className="past-section">
          <div className="container">
            {this.props.proposals
              .filter(p => p.finalized)
              .map(proposal => (
                <div key={proposal._token} className="proposal-wrapper">
                  <div className="remaining" />

                  <div className="details-wrapper">
                    <Link className="title" to={`/proposal/${proposal.id}`}>
                      {proposal.title}
                    </Link>
                    <p className="description">{proposal.description}</p>
                    <Link className="vote-wrapper" to={`/proposal/${proposal.id}`}>
                      Read more
                    </Link>
                  </div>

                  <div className="results-wrapper">
                    <div className="yes">
                      <span className="word">yes</span>
                      <div className="bar">
                        <div className="bar-yes" style={{ width: `${proposal.yesPercentage}%` }} />
                      </div>
                      <div className="number">{`${Math.floor(proposal.yesPercentage)}`}</div>
                      <div className="votes-number">{proposal.totalYes} VT</div>
                    </div>
                    <div className="no">
                      <span className="word">no</span>
                      <div className="number">{`${Math.floor(proposal.noPercentage)}`}</div>
                      <div className="votes-number">{proposal.totalNo} VT</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }
}

AllProposals.propTypes = {
  getProposals: PropTypes.func.isRequired,
  proposals: PropTypes.array.isRequired,
};

const mapStateToProps = state => ({
  proposals: state.proposal.proposals,
});

export default connect(
  mapStateToProps,
  {
    getProposals,
  }
)(AllProposals);
