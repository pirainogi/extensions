import * as React from 'react';
import { Button } from '@contentful/forma-36-react-components';
import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { SortableComponent } from './SortableComponent';

type Hash = Record<string, any>;

interface Props {
  sdk: FieldExtensionSDK;
  cta: string;
  makeThumbnail: (resource: Hash, config: Hash) => (string | undefined)[];
  openDialog: (sdk: FieldExtensionSDK, currentValue: Hash[], config: Hash) => Promise<Hash[]>;
  isDisabled: (currentValue: Hash[], config: Hash) => boolean;
}

interface State {
  value: Hash[];
}

export default class Field extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const value = props.sdk.field.getValue();
    this.state = {
      value: Array.isArray(value) ? value : []
    };
  }

  detachExternalChangeHandler: Function | null = null;

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(this.onExternalChange);
  }

  componentWillUnmount() {
    if (this.detachExternalChangeHandler) {
      this.detachExternalChangeHandler();
    }
  }

  onExternalChange = (value?: Hash[]) => {
    this.setState({ value: Array.isArray(value) ? value : [] });
  };

  updateStateValue = async (value: Hash[]) => {
    this.setState({ value });
    if (value.length > 0) {
      await this.props.sdk.field.setValue(value);
    } else {
      await this.props.sdk.field.removeValue();
    }
  };

  onDialogOpen = async () => {
    const currentValue = this.state.value;
    const config = this.props.sdk.parameters.installation;
    const result = await this.props.openDialog(this.props.sdk, currentValue, config);

    if (result.length > 0) {
      const newValue = [...(this.state.value || []), ...result];

      await this.updateStateValue(newValue);
    }
  };

  render = () => {
    const currentValue = this.state.value;
    const hasItems = currentValue.length > 0;
    const config = this.props.sdk.parameters.installation;
    const isDisabled = this.props.isDisabled(currentValue, config);

    return (
      <>
        {hasItems && (
          <SortableComponent
            resources={this.state.value}
            onChange={this.updateStateValue}
            config={config}
            makeThumbnail={this.props.makeThumbnail}
          />
        )}
        <div className="actions">
          <div className="logo" />
          <Button
            icon="Asset"
            buttonType="muted"
            size="small"
            onClick={this.onDialogOpen}
            disabled={isDisabled}>
            {this.props.cta}
          </Button>
        </div>
      </>
    );
  };
}
