import React from 'react';
import Card from 'react-bootstrap/Card';
import Image from 'react-bootstrap/Image';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

class FacebookButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      login: false,
      data: {},
      picture: '',
      pages: [],
      selectedPage: null,
      accessToken: '',
      pageData: {
        followers: 0,
        engagement: 0,
        impressions: 0,
        reactions: 0
      }
    };
  }

  componentDidMount() {
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: '1625806251318006',
        cookie: true,
        xfbml: true,
        version: 'v13.0'
      });

      window.FB.AppEvents.logPageView();
    };

    ((d, s, id) => {
      let js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');
  }

  checkLoginState = () => {
    window.FB.getLoginStatus((response) => {
      this.statusChangeCallback(response);
    });
  }

  statusChangeCallback = (response) => {
    console.log(response);
    if (response.status === 'connected') {
      const { accessToken } = response.authResponse;
      window.FB.api('/me', { fields: 'name,email,picture' }, (userInfo) => {
        console.log(userInfo);
        this.setState({
          login: true,
          data: userInfo,
          picture: userInfo.picture.data.url,
          accessToken: accessToken
        });

        fetch(`https://graph.facebook.com/v13.0/me/accounts?access_token=${accessToken}`)
          .then(res => {
            if (!res.ok) {
              throw new Error('Network response was not ok');
            }
            return res.json();
          })
          .then(
            (result) => {
              console.log('API Response:', result);
              this.setState({ pages: result.data });
            },
            (error) => {
              console.error('Fetch error:', error);
            }
          );
      });
    } else {
      console.log('User not logged in');
      this.setState({ login: false });
    }
  }

  handleClick = () => {
    window.FB.login(this.checkLoginState, {
      scope: 'public_profile,email,pages_show_list,read_insights',
      auth_type: 'rerequest',
      config_id: '1035986881191931'
      });
  }

  handleSelectChange = (event) => {
    const pageId = event.target.value;
    this.setState({ selectedPage: pageId });
  
    // Fetch available insights metrics for the selected page
    fetch(`https://graph.facebook.com/v13.0/${pageId}/insights/page_fans,page_engaged_users,page_impressions,page_actions_post_reactions_total?access_token=${this.state.accessToken}`)
      .then(res => res.json())
      .then(
        (result) => {
          console.log('Page Insights:', result);
          const followers = result.data.find(item => item.name === 'page_fans')?.values[0].value || 0;
          const engagement = result.data.find(item => item.name === 'page_engaged_users')?.values[0].value || 0;
          const impressions = result.data.find(item => item.name === 'page_impressions')?.values[0].value || 0;
          const reactions = result.data.find(item => item.name === 'page_actions_post_reactions_total')?.values[0].value || 0;
          
          this.setState({
            pageData: {
              followers,
              engagement,
              impressions,
              reactions
            }
          });
        },
        (error) => {
          console.error('Fetch error:', error);
        }
      );
  }
  

  render() {
    const { login, data, picture, pages, pageData } = this.state;
  
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        {!login &&
          <Button onClick={this.handleClick} style={{ fontSize: '20px', padding: '10px 20px' }}>
            Login with Facebook
          </Button>
        }
        {login &&
          <div>
            <Card style={{ width: '600px' }}>
              <Card.Header>
                <Image src={picture} roundedCircle />
              </Card.Header>
              <Card.Body>
                <Card.Title>{data.name}</Card.Title>
                <Card.Text>
                  {data.email}
                </Card.Text>
                
                <Form.Select as="select" aria-label="Select Page" className="form-select" onChange={this.handleSelectChange}>
                  <option>Select a page</option>
                  {pages.map((page, index) => (
                    <option key={index} value={page.id}>{page.name}</option>
                  ))}
                </Form.Select>
              </Card.Body>
            </Card>
  
            <div className="cards">
              <Card style={{ width: '150px' }}>
                <Card.Body>
                  <Card.Title>Total Followers / Fans</Card.Title>
                  <Card.Text>{pageData.followers}</Card.Text>
                </Card.Body>
              </Card>
  
              <Card style={{ width: '150px' }}>
                <Card.Body>
                  <Card.Title>Total Engagement</Card.Title>
                  <Card.Text>{pageData.engagement}</Card.Text>
                </Card.Body>
              </Card>
  
              <Card style={{ width: '150px' }}>
                <Card.Body>
                  <Card.Title>Total Impressions</Card.Title>
                  <Card.Text>{pageData.impressions}</Card.Text>
                </Card.Body>
              </Card>
  
              <Card style={{ width: '150px' }}>
                <Card.Body>
                  <Card.Title>Total Reactions</Card.Title>
                  <Card.Text>{pageData.reactions}</Card.Text>
                </Card.Body>
              </Card>
            </div>
          </div>
        }
      </div>
    );
  }  
}

export default FacebookButton;
